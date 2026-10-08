import { AppConfigService } from "@/app.config";
import { KeycloakSyncService } from "./keycloak-sync.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { Unit, User } from "@prisma/client";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function makeConfig(configPath: string): AppConfigService {
  return {
    grafana: { configPath, path: "/gdb", url: "http://grafana.example.com" },
    volttron: { campus: "pnnl", building: "sef" },
    instanceType: "primary",
  } as unknown as AppConfigService;
}

async function writeConfig(dir: string, filename: string, content: unknown): Promise<void> {
  await writeFile(join(dir, filename), JSON.stringify(content), "utf-8");
}

function makeUser(role: string, units: Unit[] = []): User & { units: Unit[] } {
  return {
    id: "u1",
    email: "u1@example.com",
    role,
    units,
  } as unknown as User & { units: Unit[] };
}

function unit(campus: string, building: string, name: string): Unit {
  return { campus, building, name } as unknown as Unit;
}

// scenario: grafana-roles-from-configs
describe("a user's required roles are exactly the keycloak_role values the configs list", () => {
  let tempDir: string;
  let sync: KeycloakSyncService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "grafana-roles-"));
    sync = new KeycloakSyncService(
      makeConfig(tempDir),
      {} as unknown as PrismaService,
      {} as unknown as SubscriptionService,
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("grants a user with one unit the RTU role and the Site Overview role from their building's config", async () => {
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://g/rtu1", keycloak_role: "pnnl-sef-rtu1-viewer" },
      "RTU Overview - RTU2": { url: "http://g/rtu2", keycloak_role: "pnnl-sef-rtu2-viewer" },
      "Site Overview": { url: "http://g/site", keycloak_role: "pnnl-sef-site-viewer" },
    });
    await sync.loadDashboardRoles();

    const roles = sync
      .determineRequiredRoles(makeUser("user", [unit("pnnl", "sef", "RTU1")]))
      .sort();
    expect(roles).toEqual(["pnnl-sef-rtu1-viewer", "pnnl-sef-site-viewer"]);
  });

  it("matches case-insensitively on campus, building and unit name, keeping the role name as the config lists it", async () => {
    await writeConfig(tempDir, "PNNL--SEF_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://g/rtu1", keycloak_role: "PNNL-SEF-RTU1-Viewer" },
      "Site Overview": { url: "http://g/site", keycloak_role: "PNNL-SEF-Site-Viewer" },
    });
    await sync.loadDashboardRoles();

    const roles = sync
      .determineRequiredRoles(makeUser("user", [unit("pnnl", "sef", "rtu1")]))
      .sort();
    expect(roles).toEqual(["PNNL-SEF-RTU1-Viewer", "PNNL-SEF-Site-Viewer"]);
  });

  it("grants an admin every keycloak_role across every config", async () => {
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://g/a", keycloak_role: "role-A" },
      "Site Overview": { url: "http://g/sa", keycloak_role: "role-site-A" },
    });
    await writeConfig(tempDir, "pnnl--other_dashboard_urls.json", {
      "RTU Overview - RTU9": { url: "http://g/b", keycloak_role: "role-B" },
    });
    await sync.loadDashboardRoles();

    const roles = sync.determineRequiredRoles(makeUser("admin")).sort();
    expect(roles).toEqual(["role-A", "role-B", "role-site-A"]);
  });

  it("skips a unit whose campus/building has no matching config file", async () => {
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://g/rtu1", keycloak_role: "pnnl-sef-rtu1" },
      "Site Overview": { url: "http://g/site", keycloak_role: "pnnl-sef-site" },
    });
    await sync.loadDashboardRoles();

    const roles = sync
      .determineRequiredRoles(
        makeUser("user", [unit("pnnl", "sef", "RTU1"), unit("other", "building", "x")]),
      )
      .sort();
    expect(roles).toEqual(["pnnl-sef-rtu1", "pnnl-sef-site"]);
  });

  it("returns no roles for a user with no 'user' or 'admin' role, however many units they have", async () => {
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://g/rtu1", keycloak_role: "role-rtu1" },
      "Site Overview": { url: "http://g/site", keycloak_role: "role-site" },
    });
    await sync.loadDashboardRoles();

    expect(sync.determineRequiredRoles(makeUser("", [unit("pnnl", "sef", "RTU1")]))).toEqual([]);
  });

  it("ignores a config entry that has no keycloak_role", async () => {
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://g/rtu1" },
      "Site Overview": { url: "http://g/site", keycloak_role: "pnnl-sef-site" },
    });
    await sync.loadDashboardRoles();

    const roles = sync
      .determineRequiredRoles(makeUser("user", [unit("pnnl", "sef", "RTU1")]))
      .sort();
    expect(roles).toEqual(["pnnl-sef-site"]);
  });
});
