import { KeycloakAdminService } from "./keycloak-admin.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";

const BASE_ISSUER = "https://auth.example.com/realms/myrealm";

function makeConfig(overrides?: Partial<AppConfigService["keycloak"]>): AppConfigService {
  return {
    keycloak: {
      adminInternalUrl: "",
      issuerUrl: BASE_ISSUER,
      admin: "admin",
      adminPassword: "secret",
      adminRole: "realm-admin",
      ...overrides,
    },
  } as unknown as AppConfigService;
}

function makePrisma(account: object | null = null): PrismaService {
  return {
    prisma: {
      account: {
        findFirst: jest.fn().mockResolvedValue(account),
      },
    },
  } as unknown as PrismaService;
}

function mockOk(body: unknown): Response {
  return { ok: true, json: jest.fn().mockResolvedValue(body), text: jest.fn() } as unknown as Response;
}

function mockFail(status: number, text = "error"): Response {
  return { ok: false, status, text: jest.fn().mockResolvedValue(text) } as unknown as Response;
}

const TOKEN_RESPONSE = { access_token: "tok123" };
const REALM_ROLES = [
  { id: "r1", name: "viewer" },
  { id: "r2", name: "editor" },
];
const RM_CLIENTS = [{ id: "rm-uuid", clientId: "realm-management" }];
const RM_ROLES = [{ id: "rr1", name: "realm-admin" }];

let mockFetch: jest.SpyInstance;

beforeEach(() => {
  mockFetch = jest.spyOn(global, "fetch");
});

afterEach(() => {
  mockFetch.mockRestore();
});

describe("KeycloakAdminService", () => {
  describe("URL helpers (via fetch call URLs)", () => {
    it("keycloakBase: derives from issuerUrl when adminInternalUrl is empty", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValue(mockOk(TOKEN_RESPONSE));
      await svc.getAdminToken();
      expect((mockFetch.mock.calls[0][0] as string)).toContain("https://auth.example.com/realms/master");
    });

    it("keycloakBase: uses adminInternalUrl when set, strips trailing slash", async () => {
      const svc = new KeycloakAdminService(
        makeConfig({ adminInternalUrl: "http://keycloak:8080/" }),
        makePrisma(),
      );
      mockFetch.mockResolvedValue(mockOk(TOKEN_RESPONSE));
      await svc.getAdminToken();
      expect((mockFetch.mock.calls[0][0] as string)).toContain("http://keycloak:8080/realms/master");
    });

    it("adminBase: includes realm extracted from issuerUrl", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(REALM_ROLES));
      await svc.listRealmRoles();
      const url = mockFetch.mock.calls[1][0] as string;
      expect(url).toContain("/admin/realms/myrealm/roles");
    });
  });

  describe("getAdminToken()", () => {
    it("POSTs to masterTokenUrl with grant_type=password and admin credentials", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValue(mockOk(TOKEN_RESPONSE));
      await svc.getAdminToken();
      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("realms/master/protocol/openid-connect/token");
      expect(opts.method).toBe("POST");
      expect((opts.body as string)).toContain("grant_type=password");
      expect((opts.body as string)).toContain("username=admin");
    });

    it("returns the access_token string", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValue(mockOk(TOKEN_RESPONSE));
      const token = await svc.getAdminToken();
      expect(token).toBe("tok123");
    });

    it("throws a descriptive error on non-ok response", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValue(mockFail(401));
      await expect(svc.getAdminToken()).rejects.toThrow("Failed to obtain Keycloak admin token");
    });
  });

  describe("listRealmRoles()", () => {
    it("GETs adminBase/roles with Bearer token", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(REALM_ROLES));
      await svc.listRealmRoles();
      const [url, opts] = mockFetch.mock.calls[1] as [string, RequestInit];
      expect(url).toMatch(/\/admin\/realms\/myrealm\/roles$/);
      expect((opts.headers as Record<string, string>)["Authorization"]).toBe("Bearer tok123");
    });

    it("returns the roles array", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValueOnce(mockOk(TOKEN_RESPONSE)).mockResolvedValueOnce(mockOk(REALM_ROLES));
      const result = await svc.listRealmRoles();
      expect(result).toEqual(REALM_ROLES);
    });

    it("throws on non-ok response", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValueOnce(mockOk(TOKEN_RESPONSE)).mockResolvedValueOnce(mockFail(403));
      await expect(svc.listRealmRoles()).rejects.toThrow("Failed to list Keycloak realm roles");
    });
  });

  describe("getUserRoles()", () => {
    it("GETs .../users/{id}/role-mappings/realm with Bearer token", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValueOnce(mockOk(TOKEN_RESPONSE)).mockResolvedValueOnce(mockOk(REALM_ROLES));
      await svc.getUserRoles("kc-user-1");
      const url = mockFetch.mock.calls[1][0] as string;
      expect(url).toContain("/users/kc-user-1/role-mappings/realm");
    });

    it("returns the roles array", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValueOnce(mockOk(TOKEN_RESPONSE)).mockResolvedValueOnce(mockOk(REALM_ROLES));
      const result = await svc.getUserRoles("kc-user-1");
      expect(result).toEqual(REALM_ROLES);
    });

    it("throws on non-ok response", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValueOnce(mockOk(TOKEN_RESPONSE)).mockResolvedValueOnce(mockFail(404));
      await expect(svc.getUserRoles("kc-user-1")).rejects.toThrow("Failed to list user Keycloak realm roles");
    });
  });

  describe("assignRoles()", () => {
    it("POSTs roles JSON to .../users/{id}/role-mappings/realm", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValueOnce(mockOk(TOKEN_RESPONSE)).mockResolvedValueOnce(mockOk(null));
      await svc.assignRoles("kc-user-1", REALM_ROLES);
      const [url, opts] = mockFetch.mock.calls[1] as [string, RequestInit];
      expect(url).toContain("/users/kc-user-1/role-mappings/realm");
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body as string)).toEqual(REALM_ROLES);
    });

    it("throws on non-ok response", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValueOnce(mockOk(TOKEN_RESPONSE)).mockResolvedValueOnce(mockFail(500));
      await expect(svc.assignRoles("kc-user-1", REALM_ROLES)).rejects.toThrow("Failed to assign Keycloak realm roles");
    });
  });

  describe("revokeRoles()", () => {
    it("DELETEs roles JSON from .../users/{id}/role-mappings/realm", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValueOnce(mockOk(TOKEN_RESPONSE)).mockResolvedValueOnce(mockOk(null));
      await svc.revokeRoles("kc-user-1", REALM_ROLES);
      const [url, opts] = mockFetch.mock.calls[1] as [string, RequestInit];
      expect(url).toContain("/users/kc-user-1/role-mappings/realm");
      expect(opts.method).toBe("DELETE");
    });

    it("throws on non-ok response", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch.mockResolvedValueOnce(mockOk(TOKEN_RESPONSE)).mockResolvedValueOnce(mockFail(500));
      await expect(svc.revokeRoles("kc-user-1", REALM_ROLES)).rejects.toThrow("Failed to revoke Keycloak realm roles");
    });
  });

  describe("listRealmManagementRoles()", () => {
    it("fetches realm-management client UUID then GETs its roles", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockOk(RM_ROLES));
      const result = await svc.listRealmManagementRoles();
      expect(result).toEqual(RM_ROLES);
      const rolesUrl = mockFetch.mock.calls[2][0] as string;
      expect(rolesUrl).toContain("/clients/rm-uuid/roles");
    });

    it("throws when realm-management client is not found", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk([]));
      await expect(svc.listRealmManagementRoles()).rejects.toThrow("realm-management client not found");
    });

    it("throws on non-ok client lookup response", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockFail(403));
      await expect(svc.listRealmManagementRoles()).rejects.toThrow("Failed to find realm-management client");
    });
  });

  describe("getUserRealmManagementRoles()", () => {
    it("fetches client UUID then GETs user client role-mappings", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockOk(RM_ROLES));
      const result = await svc.getUserRealmManagementRoles("kc-user-1");
      expect(result).toEqual(RM_ROLES);
      const url = mockFetch.mock.calls[2][0] as string;
      expect(url).toContain("/users/kc-user-1/role-mappings/clients/rm-uuid");
    });

    it("throws on non-ok role response", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockFail(403));
      await expect(svc.getUserRealmManagementRoles("kc-user-1")).rejects.toThrow(
        "Failed to list user realm-management roles",
      );
    });
  });

  describe("assignRealmManagementRoles()", () => {
    it("POSTs roles to .../users/{id}/role-mappings/clients/{clientId}", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockOk(null));
      await svc.assignRealmManagementRoles("kc-user-1", RM_ROLES);
      const [url, opts] = mockFetch.mock.calls[2] as [string, RequestInit];
      expect(url).toContain("/users/kc-user-1/role-mappings/clients/rm-uuid");
      expect(opts.method).toBe("POST");
    });

    it("throws on non-ok response", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockFail(500));
      await expect(svc.assignRealmManagementRoles("kc-user-1", RM_ROLES)).rejects.toThrow(
        "Failed to assign realm-management roles",
      );
    });
  });

  describe("revokeRealmManagementRoles()", () => {
    it("DELETEs roles from .../users/{id}/role-mappings/clients/{clientId}", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockOk(null));
      await svc.revokeRealmManagementRoles("kc-user-1", RM_ROLES);
      const [url, opts] = mockFetch.mock.calls[2] as [string, RequestInit];
      expect(url).toContain("/users/kc-user-1/role-mappings/clients/rm-uuid");
      expect(opts.method).toBe("DELETE");
    });

    it("throws on non-ok response", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma());
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockFail(500));
      await expect(svc.revokeRealmManagementRoles("kc-user-1", RM_ROLES)).rejects.toThrow(
        "Failed to revoke realm-management roles",
      );
    });
  });

  describe("hasAdminAccess()", () => {
    it("returns false when lookupKeycloakUserId finds no keycloak account", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma(null));
      const result = await svc.hasAdminAccess("app-user-1");
      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns true when the user holds the configured adminRole", async () => {
      const svc = new KeycloakAdminService(
        makeConfig(),
        makePrisma({ providerAccountId: "kc-user-1" }),
      );
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockOk([{ id: "rr1", name: "realm-admin" }]));
      const result = await svc.hasAdminAccess("app-user-1");
      expect(result).toBe(true);
    });

    it("returns false when the user does not hold the adminRole", async () => {
      const svc = new KeycloakAdminService(
        makeConfig(),
        makePrisma({ providerAccountId: "kc-user-1" }),
      );
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockOk([{ id: "rr2", name: "other-role" }]));
      const result = await svc.hasAdminAccess("app-user-1");
      expect(result).toBe(false);
    });
  });

  describe("lookupKeycloakUserId()", () => {
    it("queries prisma.account.findFirst with provider='keycloak' and userId", async () => {
      const prisma = makePrisma({ providerAccountId: "kc-user-1" });
      const svc = new KeycloakAdminService(makeConfig(), prisma);
      await svc.lookupKeycloakUserId("app-user-1");
      expect(prisma.prisma.account.findFirst).toHaveBeenCalledWith({
        where: { userId: "app-user-1", provider: "keycloak" },
      });
    });

    it("returns providerAccountId when account is found", async () => {
      const svc = new KeycloakAdminService(
        makeConfig(),
        makePrisma({ providerAccountId: "kc-user-1" }),
      );
      const id = await svc.lookupKeycloakUserId("app-user-1");
      expect(id).toBe("kc-user-1");
    });

    it("returns null when no account is found", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma(null));
      const id = await svc.lookupKeycloakUserId("app-user-1");
      expect(id).toBeNull();
    });
  });

  describe("syncAdminRole()", () => {
    it("returns early without any fetch when lookupKeycloakUserId returns null", async () => {
      const svc = new KeycloakAdminService(makeConfig(), makePrisma(null));
      await svc.syncAdminRole("app-user-1", true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("calls assignRealmManagementRoles when grant=true and role is found", async () => {
      const svc = new KeycloakAdminService(
        makeConfig({ adminRole: "realm-admin" }),
        makePrisma({ providerAccountId: "kc-user-1" }),
      );
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))  // listRealmManagementRoles: token
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))       // listRealmManagementRoles: client list
        .mockResolvedValueOnce(mockOk(RM_ROLES))         // listRealmManagementRoles: role list
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))  // assignRealmManagementRoles: token
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))       // assignRealmManagementRoles: client list
        .mockResolvedValueOnce(mockOk(null));             // assignRealmManagementRoles: POST
      await svc.syncAdminRole("app-user-1", true);
      const assignCall = mockFetch.mock.calls[5] as [string, RequestInit];
      expect(assignCall[1].method).toBe("POST");
    });

    it("calls revokeRealmManagementRoles when grant=false and role is found", async () => {
      const svc = new KeycloakAdminService(
        makeConfig({ adminRole: "realm-admin" }),
        makePrisma({ providerAccountId: "kc-user-1" }),
      );
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockOk(RM_ROLES))
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockOk(null));
      await svc.syncAdminRole("app-user-1", false);
      const revokeCall = mockFetch.mock.calls[5] as [string, RequestInit];
      expect(revokeCall[1].method).toBe("DELETE");
    });

    it("does not throw when adminRole not found in realm-management roles", async () => {
      const svc = new KeycloakAdminService(
        makeConfig({ adminRole: "nonexistent-role" }),
        makePrisma({ providerAccountId: "kc-user-1" }),
      );
      mockFetch
        .mockResolvedValueOnce(mockOk(TOKEN_RESPONSE))
        .mockResolvedValueOnce(mockOk(RM_CLIENTS))
        .mockResolvedValueOnce(mockOk(RM_ROLES));
      await expect(svc.syncAdminRole("app-user-1", true)).resolves.toBeUndefined();
    });
  });
});
