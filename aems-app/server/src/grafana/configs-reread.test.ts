import { AppConfigService } from "@/app.config";
import { GrafanaController } from "@/api/grafana.controller";
import { KeycloakSyncService } from "@/keycloak/keycloak-sync.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Request, Response } from "express";
import { readDashboardConfigs } from "./read-dashboard-configs";

function makeConfig(configPath: string): AppConfigService {
  return {
    grafana: {
      configPath,
      path: "/gdb",
      url: "http://grafana.example.com",
    },
    volttron: { campus: "pnnl", building: "sef" },
    instanceType: "primary",
  } as unknown as AppConfigService;
}

function makeReq(): Request {
  return {
    get: () => undefined,
    socket: { remoteAddress: "127.0.0.1" },
    path: "/",
  } as unknown as Request;
}

function makeRes() {
  const res: Partial<Response> & { statusCode?: number; redirectedTo?: string; body?: unknown } = {};
  res.status = jest.fn().mockImplementation((n: number) => {
    res.statusCode = n;
    return res as Response;
  });
  res.json = jest.fn().mockImplementation((b: unknown) => {
    res.body = b;
    return res as Response;
  });
  res.redirect = jest.fn().mockImplementation((...args: unknown[]) => {
    res.redirectedTo = String(args[args.length - 1]);
    return res as Response;
  });
  return res as Response & { statusCode?: number; redirectedTo?: string };
}

function makeUser(): Express.User {
  return { id: "u1", email: "u1@example.com" } as Express.User;
}

async function writeConfig(
  dir: string,
  filename: string,
  content: Record<string, unknown>,
): Promise<void> {
  await writeFile(join(dir, filename), JSON.stringify(content), "utf-8");
}

// scenario: dashboard-configs-reread
describe("dashboard configs are re-read before every role sync and every dashboard lookup", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "grafana-reread-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("the shared reader lists a file added after a prior call", async () => {
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://grafana.example.com/d/rtu1", keycloak_role: "role-rtu1" },
    });

    const first = await readDashboardConfigs(tempDir);
    expect(first.flatMap((f) => f.entries.map((e) => e.key))).toEqual(["RTU Overview - RTU1"]);

    await writeConfig(tempDir, "pnnl--other_dashboard_urls.json", {
      "Site Overview": { url: "http://grafana.example.com/d/other", keycloak_role: "role-other" },
    });

    const second = await readDashboardConfigs(tempDir);
    const keys = second.flatMap((f) => f.entries.map((e) => e.key)).sort();
    expect(keys).toEqual(["RTU Overview - RTU1", "Site Overview"]);
  });

  it("GrafanaController serves a dashboard added after construction without a restart", async () => {
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": "http://grafana.example.com/d/rtu1",
    });

    const controller = new GrafanaController(makeConfig(tempDir));

    const firstRes = makeRes();
    await controller.dashboard(makeReq(), firstRes, makeUser(), "pnnl", "sef", "rtu1");
    expect(firstRes.redirectedTo).toBe("http://grafana.example.com/d/rtu1");

    // Second dashboard is written after the controller already handled one call.
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": "http://grafana.example.com/d/rtu1",
      "RTU Overview - RTU2": "http://grafana.example.com/d/rtu2",
    });

    const secondRes = makeRes();
    await controller.dashboard(makeReq(), secondRes, makeUser(), "pnnl", "sef", "rtu2");
    expect(secondRes.redirectedTo).toBe("http://grafana.example.com/d/rtu2");
  });

  it("KeycloakSyncService picks up a role from a file added after construction", async () => {
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://grafana.example.com/d/rtu1", keycloak_role: "role-rtu1" },
    });

    const sync = new KeycloakSyncService(
      makeConfig(tempDir),
      {} as unknown as PrismaService,
      {} as unknown as SubscriptionService,
    );

    await sync.loadDashboardRoles();
    expect(Array.from((sync as unknown as { dashboardRoles: Map<string, Set<string>> }).dashboardRoles.get("pnnl_sef") ?? []))
      .toEqual(["role-rtu1"]);

    // Add a second file after the first load.
    await writeConfig(tempDir, "pnnl--other_dashboard_urls.json", {
      "Site Overview": { url: "http://grafana.example.com/d/other", keycloak_role: "role-other" },
    });

    await sync.loadDashboardRoles();
    const map = (sync as unknown as { dashboardRoles: Map<string, Set<string>> }).dashboardRoles;
    expect(Array.from(map.get("pnnl_sef") ?? [])).toEqual(["role-rtu1"]);
    expect(Array.from(map.get("pnnl_other") ?? [])).toEqual(["role-other"]);
  });

  it("syncUserRoles calls loadDashboardRoles before determining required roles", async () => {
    const sync = new KeycloakSyncService(
      makeConfig(tempDir),
      {
        prisma: {
          user: {
            findUnique: jest.fn().mockResolvedValue({
              id: "admin1",
              email: "admin@example.com",
              role: "admin",
              units: [],
            }),
          },
        },
      } as unknown as PrismaService,
      {} as unknown as SubscriptionService,
    );

    const getUser = jest
      .spyOn(sync as unknown as { getKeycloakUser: (email: string) => Promise<null> }, "getKeycloakUser")
      .mockResolvedValue(null);

    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://grafana.example.com/d/rtu1", keycloak_role: "role-A" },
    });
    await sync.syncUserRoles("admin@example.com");
    expect(Array.from((sync as unknown as { dashboardRoles: Map<string, Set<string>> }).dashboardRoles.get("pnnl_sef") ?? []))
      .toEqual(["role-A"]);

    // Replace the file; next sync must see the new role, not the stale one.
    await writeConfig(tempDir, "pnnl--sef_dashboard_urls.json", {
      "RTU Overview - RTU1": { url: "http://grafana.example.com/d/rtu1", keycloak_role: "role-B" },
    });
    await sync.syncUserRoles("admin@example.com");
    expect(Array.from((sync as unknown as { dashboardRoles: Map<string, Set<string>> }).dashboardRoles.get("pnnl_sef") ?? []))
      .toEqual(["role-B"]);

    getUser.mockRestore();
  });
});
