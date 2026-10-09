import { AppConfigService } from "@/app.config";
import { KeycloakSyncService } from "./keycloak-sync.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
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

function makePrisma(user: unknown): PrismaService {
  return {
    prisma: {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
    },
  } as unknown as PrismaService;
}

async function writeConfig(dir: string, filename: string, content: unknown): Promise<void> {
  await writeFile(join(dir, filename), JSON.stringify(content), "utf-8");
}

interface SyncInternals {
  getKeycloakUser: jest.Mock;
  getGrafanaClientUuid: jest.Mock;
  getUserClientRoles: jest.Mock;
  assignClientRole: jest.Mock;
  removeClientRole: jest.Mock;
}

function stubKeycloakIo(
  sync: KeycloakSyncService,
  currentRoles: string[],
): SyncInternals {
  const assignClientRole = jest.fn().mockResolvedValue(undefined);
  const removeClientRole = jest.fn().mockResolvedValue(undefined);
  const getKeycloakUser = jest
    .fn()
    .mockResolvedValue({ id: "kc-u1", username: "u1", email: "u1@example.com", enabled: true });
  const getGrafanaClientUuid = jest.fn().mockResolvedValue("client-uuid");
  const getUserClientRoles = jest.fn().mockResolvedValue(currentRoles);
  const internals = sync as unknown as SyncInternals;
  internals.getKeycloakUser = getKeycloakUser;
  internals.getGrafanaClientUuid = getGrafanaClientUuid;
  internals.getUserClientRoles = getUserClientRoles;
  internals.assignClientRole = assignClientRole;
  internals.removeClientRole = removeClientRole;
  return internals;
}

// scenario: grafana-sync-removes-safely
describe("sync removes every ungranted role; a sync that read no config removes nothing", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "grafana-remove-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("removes every Grafana client role the user holds that is not in the required set", async () => {
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://g/rtu1", keycloak_role: "role-rtu1" },
      "Site Overview": { url: "http://g/site", keycloak_role: "role-site" },
    });

    const sync = new KeycloakSyncService(
      makeConfig(tempDir),
      makePrisma({
        id: "u1",
        email: "u1@example.com",
        role: "user",
        units: [{ campus: "pnnl", building: "sef", name: "RTU1" }],
      }),
      {} as unknown as SubscriptionService,
    );
    const io = stubKeycloakIo(sync, ["role-rtu1", "stale-role", "role-site"]);

    const result = await sync.syncUserRoles("u1@example.com");

    expect(result.removed).toEqual(["stale-role"]);
    expect(io.removeClientRole).toHaveBeenCalledWith("kc-u1", "client-uuid", "stale-role");
    expect(io.removeClientRole).toHaveBeenCalledTimes(1);
    expect(io.assignClientRole).not.toHaveBeenCalled();
  });

  it("removes nothing when no config file was read (empty config path)", async () => {
    const sync = new KeycloakSyncService(
      makeConfig(""),
      makePrisma({
        id: "u1",
        email: "u1@example.com",
        role: "user",
        units: [{ campus: "pnnl", building: "sef", name: "RTU1" }],
      }),
      {} as unknown as SubscriptionService,
    );
    const io = stubKeycloakIo(sync, ["role-rtu1", "role-site"]);

    const result = await sync.syncUserRoles("u1@example.com");

    expect(result.removed).toEqual([]);
    expect(io.removeClientRole).not.toHaveBeenCalled();
  });

  it("removes nothing when the config directory holds no dashboard files", async () => {
    const sync = new KeycloakSyncService(
      makeConfig(tempDir),
      makePrisma({
        id: "u1",
        email: "u1@example.com",
        role: "user",
        units: [{ campus: "pnnl", building: "sef", name: "RTU1" }],
      }),
      {} as unknown as SubscriptionService,
    );
    const io = stubKeycloakIo(sync, ["role-rtu1", "role-site"]);

    const result = await sync.syncUserRoles("u1@example.com");

    expect(result.removed).toEqual([]);
    expect(io.removeClientRole).not.toHaveBeenCalled();
  });
});
