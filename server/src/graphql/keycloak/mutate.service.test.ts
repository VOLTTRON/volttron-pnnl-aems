import { KeycloakMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { KeycloakAdminService } from "./keycloak-admin.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown, ctx: unknown) => unknown> = {};

function makeMockT() {
  return {
    field: jest.fn((opts: any) => opts),
    arg: {
      string: jest.fn((opts?: any) => opts),
      stringList: jest.fn((opts?: any) => opts),
    },
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeKeycloakAdmin(): KeycloakAdminService {
  return {
    lookupKeycloakUserId: jest.fn().mockResolvedValue("kc-user-1"),
    listRealmRoles: jest.fn().mockResolvedValue([
      { id: "r1", name: "viewer" },
      { id: "r2", name: "admin" },
    ]),
    assignRoles: jest.fn().mockResolvedValue(undefined),
    getUserRoles: jest.fn().mockResolvedValue([{ id: "r1", name: "viewer" }]),
    revokeRoles: jest.fn().mockResolvedValue(undefined),
    syncAdminRole: jest.fn().mockResolvedValue(undefined),
  } as unknown as KeycloakAdminService;
}

describe("KeycloakMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("assignKeycloakRoles resolver", () => {
    it("throws when lookupKeycloakUserId returns null", async () => {
      const keycloak = makeKeycloakAdmin();
      (keycloak.lookupKeycloakUserId as jest.Mock).mockResolvedValue(null);
      new KeycloakMutation(makeBuilder(), keycloak);

      // plain t.field signature: (root, args, ctx)
      const resolve = resolvers["assignKeycloakRoles"] as (...a: unknown[]) => Promise<unknown>;
      await expect(resolve({}, { userId: "app-1", roles: ["admin"] }, {})).rejects.toThrow(
        "User has no linked Keycloak account.",
      );
    });

    it("filters listRealmRoles by requested names and calls assignRoles with matched roles only", async () => {
      const keycloak = makeKeycloakAdmin();
      new KeycloakMutation(makeBuilder(), keycloak);

      const resolve = resolvers["assignKeycloakRoles"] as (...a: unknown[]) => Promise<unknown>;
      await resolve({}, { userId: "app-1", roles: ["admin"] }, {});

      expect(keycloak.listRealmRoles).toHaveBeenCalled();
      expect(keycloak.assignRoles).toHaveBeenCalledWith("kc-user-1", [{ id: "r2", name: "admin" }]);
    });

    it("returns true on success", async () => {
      const keycloak = makeKeycloakAdmin();
      new KeycloakMutation(makeBuilder(), keycloak);

      const resolve = resolvers["assignKeycloakRoles"] as (...a: unknown[]) => Promise<unknown>;
      const result = await resolve({}, { userId: "app-1", roles: ["viewer"] }, {});

      expect(result).toBe(true);
    });
  });

  describe("revokeKeycloakRoles resolver", () => {
    it("throws when lookupKeycloakUserId returns null", async () => {
      const keycloak = makeKeycloakAdmin();
      (keycloak.lookupKeycloakUserId as jest.Mock).mockResolvedValue(null);
      new KeycloakMutation(makeBuilder(), keycloak);

      const resolve = resolvers["revokeKeycloakRoles"] as (...a: unknown[]) => Promise<unknown>;
      await expect(resolve({}, { userId: "app-1", roles: ["viewer"] }, {})).rejects.toThrow(
        "User has no linked Keycloak account.",
      );
    });

    it("filters getUserRoles by requested names and calls revokeRoles with matched roles only", async () => {
      const keycloak = makeKeycloakAdmin();
      new KeycloakMutation(makeBuilder(), keycloak);

      const resolve = resolvers["revokeKeycloakRoles"] as (...a: unknown[]) => Promise<unknown>;
      await resolve({}, { userId: "app-1", roles: ["viewer"] }, {});

      expect(keycloak.getUserRoles).toHaveBeenCalledWith("kc-user-1");
      expect(keycloak.revokeRoles).toHaveBeenCalledWith("kc-user-1", [{ id: "r1", name: "viewer" }]);
    });

    it("returns true on success", async () => {
      const keycloak = makeKeycloakAdmin();
      new KeycloakMutation(makeBuilder(), keycloak);

      const resolve = resolvers["revokeKeycloakRoles"] as (...a: unknown[]) => Promise<unknown>;
      const result = await resolve({}, { userId: "app-1", roles: ["viewer"] }, {});

      expect(result).toBe(true);
    });
  });

  describe("grantKeycloakAdminAccess resolver", () => {
    it("calls syncAdminRole(userId, true)", async () => {
      const keycloak = makeKeycloakAdmin();
      new KeycloakMutation(makeBuilder(), keycloak);

      const resolve = resolvers["grantKeycloakAdminAccess"] as (...a: unknown[]) => Promise<unknown>;
      await resolve({}, { userId: "app-1" }, {});

      expect(keycloak.syncAdminRole).toHaveBeenCalledWith("app-1", true);
    });

    it("returns true on success", async () => {
      const keycloak = makeKeycloakAdmin();
      new KeycloakMutation(makeBuilder(), keycloak);

      const resolve = resolvers["grantKeycloakAdminAccess"] as (...a: unknown[]) => Promise<unknown>;
      const result = await resolve({}, { userId: "app-1" }, {});

      expect(result).toBe(true);
    });
  });

  describe("revokeKeycloakAdminAccess resolver", () => {
    it("calls syncAdminRole(userId, false)", async () => {
      const keycloak = makeKeycloakAdmin();
      new KeycloakMutation(makeBuilder(), keycloak);

      const resolve = resolvers["revokeKeycloakAdminAccess"] as (...a: unknown[]) => Promise<unknown>;
      await resolve({}, { userId: "app-1" }, {});

      expect(keycloak.syncAdminRole).toHaveBeenCalledWith("app-1", false);
    });

    it("returns true on success", async () => {
      const keycloak = makeKeycloakAdmin();
      new KeycloakMutation(makeBuilder(), keycloak);

      const resolve = resolvers["revokeKeycloakAdminAccess"] as (...a: unknown[]) => Promise<unknown>;
      const result = await resolve({}, { userId: "app-1" }, {});

      expect(result).toBe(true);
    });
  });
});
