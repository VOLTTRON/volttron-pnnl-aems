import { Reflector } from "@nestjs/core";
import { KeycloakSyncService } from "./keycloak-sync.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { SCHEDULE_CRON_OPTIONS } from "@nestjs/schedule/dist/schedule.constants";

function makeConfig(overrides?: Partial<AppConfigService["grafana"]>): AppConfigService {
  return {
    instanceType: "grafana",
    grafana: {
      configPath: null,
      ...overrides,
    },
    keycloak: {
      issuerUrl: "http://keycloak/realms/default",
    },
    environment: { production: false, test: true },
  } as unknown as AppConfigService;
}

function makePrisma(user: unknown): PrismaService {
  return {
    prisma: {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

function makeSubs(): SubscriptionService {
  return {
    subscribe: jest.fn().mockResolvedValue(1),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionService;
}

function mockOk(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

const KEYCLOAK_USER = { id: "kc-user-1", username: "user@example.com", email: "user@example.com", enabled: true };
const GRAFANA_CLIENT = [{ id: "grafana-uuid", clientId: "grafana-oauth" }];

let mockFetch: jest.SpyInstance;

beforeEach(() => {
  mockFetch = jest.spyOn(global, "fetch");
});

afterEach(() => {
  mockFetch.mockRestore();
});

describe("KeycloakSyncService", () => {
  // scenario: dashboard-configs-reread
  describe("configs re-read on each sync", () => {
    it("re-reads dashboard configs at the start of every syncUserRoles call", async () => {
      const user = { email: "user@example.com", role: "user", units: [] };
      const prisma = makePrisma(user);
      const svc = new KeycloakSyncService(makeConfig(), prisma, makeSubs());

      const loadSpy = jest
        .spyOn(svc as unknown as { loadDashboardRoles: () => Promise<void> }, "loadDashboardRoles")
        .mockResolvedValue(undefined);

      mockFetch.mockImplementation((input: URL | string | Request) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/token")) return Promise.resolve(mockOk({ access_token: "tok", expires_in: 300 }));
        if (url.includes("?email=")) return Promise.resolve(mockOk([KEYCLOAK_USER]));
        if (url.includes("?clientId=")) return Promise.resolve(mockOk(GRAFANA_CLIENT));
        if (url.includes("/role-mappings/clients/")) return Promise.resolve(mockOk([]));
        return Promise.resolve(mockOk({}));
      });

      await svc.syncUserRoles("user@example.com");
      await svc.syncUserRoles("user@example.com");
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });
  });

  // scenario: grafana-sync-removes-safely
  describe("sync removal safety", () => {
    it("removes nothing when no config file was ever read -- empty dashboardRoles must not look like 'strip everything'", async () => {
      const user = { email: "user@example.com", role: "user admin", units: [] };
      const prisma = makePrisma(user);
      // configPath is null, so loadDashboardRoles leaves dashboardConfigsRead=false
      const svc = new KeycloakSyncService(makeConfig(), prisma, makeSubs());

      // The admin path above would normally compute requiredRoles=getAllGrafanaRoles()=[]
      // and remove every current role. Prove it does not.
      mockFetch.mockImplementation((input: URL | string | Request) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/token")) return Promise.resolve(mockOk({ access_token: "tok", expires_in: 300 }));
        if (url.includes("?email=")) return Promise.resolve(mockOk([KEYCLOAK_USER]));
        if (url.includes("?clientId=")) return Promise.resolve(mockOk(GRAFANA_CLIENT));
        if (url.includes("/role-mappings/clients/")) {
          return Promise.resolve(
            mockOk([
              { id: "x", name: "grafana-view-site-pnnl_bsf", composite: false, clientRole: true, containerId: "grafana-uuid" },
              { id: "y", name: "grafana-view-unit-pnnl_bsf_ahu1", composite: false, clientRole: true, containerId: "grafana-uuid" },
            ]),
          );
        }
        return Promise.resolve(mockOk({}));
      });

      // syncUserRoles re-reads configs. With configPath=null, the real
      // loadDashboardRoles exits early leaving dashboardConfigsRead=false, which
      // is the invariant this scenario asserts.

      const result = await svc.syncUserRoles("user@example.com");
      expect(result.removed).toEqual([]);

      // No DELETE call hit the Keycloak admin API.
      const calls = mockFetch.mock.calls as Array<[URL | string | Request, RequestInit | undefined]>;
      const deletes = calls.filter(([, init]) => init?.method === "DELETE");
      expect(deletes).toEqual([]);
    });

    it("removes ungranted roles once a config has been read", async () => {
      const user = { email: "user@example.com", role: "user", units: [] };
      const prisma = makePrisma(user);
      const svc = new KeycloakSyncService(makeConfig(), prisma, makeSubs());
      // syncUserRoles re-reads configs (see dashboard-configs-reread). Stub it to
      // report success without touching the filesystem.
      jest
        .spyOn(svc as unknown as { loadDashboardRoles: () => Promise<void> }, "loadDashboardRoles")
        .mockImplementation(async () => {
          (svc as unknown as { dashboardConfigsRead: boolean }).dashboardConfigsRead = true;
        });

      mockFetch.mockImplementation((input: URL | string | Request, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/token")) return Promise.resolve(mockOk({ access_token: "tok", expires_in: 300 }));
        if (url.includes("?email=")) return Promise.resolve(mockOk([KEYCLOAK_USER]));
        if (url.includes("?clientId=")) return Promise.resolve(mockOk(GRAFANA_CLIENT));
        if (url.includes("/role-mappings/clients/") && init?.method !== "DELETE" && init?.method !== "POST") {
          return Promise.resolve(mockOk([{ id: "x", name: "stale-role", composite: false, clientRole: true, containerId: "grafana-uuid" }]));
        }
        if (url.includes("/roles/stale-role")) {
          return Promise.resolve(mockOk({ id: "x", name: "stale-role", composite: false, clientRole: true, containerId: "grafana-uuid" }));
        }
        return Promise.resolve(mockOk({}));
      });

      const result = await svc.syncUserRoles("user@example.com");
      // User has role=user but no units -> requiredRoles is []; stale-role is held but
      // not required, so it should be removed since dashboardConfigsRead is true.
      expect(result.removed).toEqual(["stale-role"]);

      const calls = mockFetch.mock.calls as Array<[URL | string | Request, RequestInit | undefined]>;
      const deletes = calls.filter(([, init]) => init?.method === "DELETE");
      expect(deletes.length).toBeGreaterThan(0);
    });
  });

  // scenario: grafana-sync-nightly
  describe("nightly sync", () => {
    it("has an @Cron decorator on dailySync, firing at midnight every day", () => {
      const reflector = new Reflector();
      const options = reflector.get<{ cronTime: string }>(
        SCHEDULE_CRON_OPTIONS,
        KeycloakSyncService.prototype.dailySync,
      );
      expect(options).toBeDefined();
      expect(options.cronTime).toBe("0 0 * * *");
    });

    it("runs the sync on each fire, so two consecutive nights sync twice", async () => {
      const prisma = makePrisma(null);
      const svc = new KeycloakSyncService(makeConfig(), prisma, makeSubs());
      // schedule() comes from BaseService; make it unconditionally true here.
      (svc as unknown as { schedule: () => boolean }).schedule = () => true;
      const syncAllSpy = jest
        .spyOn(svc as unknown as { syncAllUsers: () => Promise<void> }, "syncAllUsers")
        .mockResolvedValue(undefined);

      await svc.dailySync();
      await svc.dailySync();

      expect(syncAllSpy).toHaveBeenCalledTimes(2);
    });

    it("skips the sync when BaseService.schedule() says this container is not the one", async () => {
      const prisma = makePrisma(null);
      const svc = new KeycloakSyncService(makeConfig(), prisma, makeSubs());
      (svc as unknown as { schedule: () => boolean }).schedule = () => false;
      const syncAllSpy = jest
        .spyOn(svc as unknown as { syncAllUsers: () => Promise<void> }, "syncAllUsers")
        .mockResolvedValue(undefined);

      await svc.dailySync();

      expect(syncAllSpy).not.toHaveBeenCalled();
    });
  });
});
