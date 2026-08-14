import { KeycloakQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { KeycloakObject } from "./object.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown, ctx: unknown) => unknown> = {};

function makeMockT() {
  return {
    field: jest.fn((opts: any) => opts),
    arg: {
      string: jest.fn((opts?: any) => opts),
    },
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeKeycloakObject(): KeycloakObject {
  return { KeycloakRole: "KeycloakRole" } as unknown as KeycloakObject;
}

function makeKeycloakAdmin(): KeycloakAdminService {
  return {
    listRealmRoles: jest.fn().mockResolvedValue([]),
    lookupKeycloakUserId: jest.fn().mockResolvedValue(null),
    getUserRoles: jest.fn().mockResolvedValue([]),
    hasAdminAccess: jest.fn().mockResolvedValue(false),
  } as unknown as KeycloakAdminService;
}

describe("KeycloakQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("readAvailableKeycloakRoles resolver", () => {
    it("calls listRealmRoles() and returns the result", async () => {
      const roles = [{ id: "r1", name: "viewer" }];
      const keycloak = makeKeycloakAdmin();
      (keycloak.listRealmRoles as jest.Mock).mockResolvedValue(roles);
      new KeycloakQuery(makeBuilder(), keycloak, makeKeycloakObject());

      // plain t.field signature: (root, args, ctx)
      const resolve = resolvers["readAvailableKeycloakRoles"] as (...a: unknown[]) => Promise<unknown>;
      const result = await resolve({}, {}, {});

      expect(keycloak.listRealmRoles).toHaveBeenCalled();
      expect(result).toEqual(roles);
    });
  });

  describe("readKeycloakRoles resolver", () => {
    it("returns [] when lookupKeycloakUserId returns null", async () => {
      const keycloak = makeKeycloakAdmin();
      (keycloak.lookupKeycloakUserId as jest.Mock).mockResolvedValue(null);
      new KeycloakQuery(makeBuilder(), keycloak, makeKeycloakObject());

      const resolve = resolvers["readKeycloakRoles"] as (...a: unknown[]) => Promise<unknown>;
      const result = await resolve({}, { userId: "app-1" }, {});

      expect(result).toEqual([]);
      expect(keycloak.getUserRoles).not.toHaveBeenCalled();
    });

    it("calls getUserRoles with the keycloak user id when found", async () => {
      const roles = [{ id: "r1", name: "admin" }];
      const keycloak = makeKeycloakAdmin();
      (keycloak.lookupKeycloakUserId as jest.Mock).mockResolvedValue("kc-999");
      (keycloak.getUserRoles as jest.Mock).mockResolvedValue(roles);
      new KeycloakQuery(makeBuilder(), keycloak, makeKeycloakObject());

      const resolve = resolvers["readKeycloakRoles"] as (...a: unknown[]) => Promise<unknown>;
      const result = await resolve({}, { userId: "app-1" }, {});

      expect(keycloak.lookupKeycloakUserId).toHaveBeenCalledWith("app-1");
      expect(keycloak.getUserRoles).toHaveBeenCalledWith("kc-999");
      expect(result).toEqual(roles);
    });
  });

  describe("readKeycloakAdminAccess resolver", () => {
    it("calls hasAdminAccess with args.userId and returns true", async () => {
      const keycloak = makeKeycloakAdmin();
      (keycloak.hasAdminAccess as jest.Mock).mockResolvedValue(true);
      new KeycloakQuery(makeBuilder(), keycloak, makeKeycloakObject());

      const resolve = resolvers["readKeycloakAdminAccess"] as (...a: unknown[]) => Promise<unknown>;
      const result = await resolve({}, { userId: "app-1" }, {});

      expect(keycloak.hasAdminAccess).toHaveBeenCalledWith("app-1");
      expect(result).toBe(true);
    });

    it("returns false when hasAdminAccess returns false", async () => {
      const keycloak = makeKeycloakAdmin();
      (keycloak.hasAdminAccess as jest.Mock).mockResolvedValue(false);
      new KeycloakQuery(makeBuilder(), keycloak, makeKeycloakObject());

      const resolve = resolvers["readKeycloakAdminAccess"] as (...a: unknown[]) => Promise<unknown>;
      const result = await resolve({}, { userId: "app-1" }, {});

      expect(result).toBe(false);
    });
  });
});
