jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

import { buildConfig } from "./authjs.config";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";
import { SubscriptionService } from "@/subscription/subscription.service";

function makeConfig(overrides: Partial<AppConfigService> = {}): AppConfigService {
  return {
    nodeEnv: "test",
    cors: { origin: "https://example.com" },
    keycloak: {
      issuerUrl: "https://keycloak.example.com/realms/myrealm",
      clientId: "my-client",
      clientSecret: "secret",
      passRoles: true,
      defaultRole: "user",
    },
    auth: {
      framework: "authjs",
      providers: ["keycloak"],
      debug: false,
    },
    jwt: { secret: "jwt-secret" },
    session: { maxAge: 86400, store: "database" },
    ...overrides,
  } as unknown as AppConfigService;
}

function makePrisma(userOverride: unknown = null): PrismaService {
  return {
    prisma: {
      user: {
        findFirst: jest.fn().mockResolvedValue(userOverride),
        update: jest.fn().mockResolvedValue({ id: "u1", role: "user" }),
        create: jest.fn().mockResolvedValue({ id: "u1", role: "user" }),
        findUnique: jest.fn().mockResolvedValue(userOverride),
      },
    },
  } as unknown as PrismaService;
}

function makeAuthService(): AuthService {
  return {
    getProviderNames: jest.fn().mockReturnValue([]),
    getProvider: jest.fn().mockReturnValue(undefined),
  } as unknown as AuthService;
}

function makeSubscriptionService(): SubscriptionService {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionService;
}

describe("buildConfig", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a config object with required keys", () => {
    const config = buildConfig(makeConfig(), makePrisma(), makeAuthService(), makeSubscriptionService());

    expect(config).toHaveProperty("callbacks");
    expect(config).toHaveProperty("session");
    expect(config).toHaveProperty("providers");
    expect(config).toHaveProperty("secret");
  });

  it("sets basePath to /authjs", () => {
    const config = buildConfig(makeConfig(), makePrisma(), makeAuthService(), makeSubscriptionService());
    expect(config.basePath).toBe("/authjs");
  });

  it("session strategy is database when store=database", () => {
    const config = buildConfig(makeConfig(), makePrisma(), makeAuthService(), makeSubscriptionService());
    expect(config.session?.strategy).toBe("database");
  });

  it("session strategy is jwt when store=jwt", () => {
    const config = buildConfig(
      makeConfig({ session: { maxAge: 86400, store: "jwt" } } as unknown as Partial<AppConfigService>),
      makePrisma(),
      makeAuthService(),
      makeSubscriptionService(),
    );
    expect(config.session?.strategy).toBe("jwt");
  });

  it("throws for an invalid session store value", () => {
    expect(() =>
      buildConfig(
        makeConfig({ session: { maxAge: 86400, store: "invalid" } } as unknown as Partial<AppConfigService>),
        makePrisma(),
        makeAuthService(),
        makeSubscriptionService(),
      ),
    ).toThrow("Invalid Authjs session store");
  });

  describe("callbacks.jwt", () => {
    it("extracts roles from a Keycloak access_token", () => {
      const config = buildConfig(makeConfig(), makePrisma(), makeAuthService(), makeSubscriptionService());

      const payload = { realm_access: { roles: ["user", "admin"] } };
      const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
      const fakeToken = `header.${encoded}.signature`;

      const token = {};
      const account = { provider: "keycloak", access_token: fakeToken };
      const result = config.callbacks?.jwt?.({ token, account } as any);

      expect((result as any).keycloakRoles).toBeDefined();
    });

    it("returns token unchanged when provider is not keycloak", () => {
      const config = buildConfig(makeConfig(), makePrisma(), makeAuthService(), makeSubscriptionService());

      const token = { sub: "u1" };
      const account = { provider: "local" };
      const result = config.callbacks?.jwt?.({ token, account } as any);

      expect(result).toEqual(token);
    });

    it("does not throw when access_token is malformed", () => {
      const config = buildConfig(makeConfig(), makePrisma(), makeAuthService(), makeSubscriptionService());

      const token = {};
      const account = { provider: "keycloak", access_token: "not.valid.base64" };

      expect(() => config.callbacks?.jwt?.({ token, account } as any)).not.toThrow();
    });
  });

  describe("callbacks.signIn", () => {
    it("returns true for non-keycloak provider without touching DB", async () => {
      const prisma = makePrisma(null);
      const config = buildConfig(makeConfig(), prisma, makeAuthService(), makeSubscriptionService());

      const result = await config.callbacks?.signIn?.({
        user: { email: "a@b.com" },
        account: { provider: "local" },
      } as any);

      expect(result).toBe(true);
      expect(prisma.prisma.user.findFirst).not.toHaveBeenCalled();
    });

    it("updates existing user roles when passRoles=true and keycloak provider", async () => {
      const existingUser = { id: "u1", name: "Alice", email: "a@b.com", accounts: [], emailVerified: null };
      const prisma = makePrisma(existingUser);
      const subscription = makeSubscriptionService();

      const config = buildConfig(makeConfig(), prisma, makeAuthService(), subscription);

      const payload = { realm_access: { roles: ["user"] } };
      const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
      const fakeToken = `h.${encoded}.s`;

      await config.callbacks?.signIn?.({
        user: { email: "a@b.com", name: "Alice" },
        account: { provider: "keycloak", providerAccountId: "kc-1", keycloakRoles: ["user"], access_token: fakeToken },
      } as any);

      expect(prisma.prisma.user.update).toHaveBeenCalled();
      expect(subscription.publish).toHaveBeenCalled();
    });

    it("creates new user when keycloak provider and user does not exist", async () => {
      const prisma = makePrisma(null);
      const subscription = makeSubscriptionService();
      const config = buildConfig(makeConfig(), prisma, makeAuthService(), subscription);

      await config.callbacks?.signIn?.({
        user: { email: "new@b.com", name: "New" },
        account: { provider: "keycloak", providerAccountId: "kc-2", keycloakRoles: [] },
      } as any);

      expect(prisma.prisma.user.create).toHaveBeenCalled();
      expect(subscription.publish).toHaveBeenCalled();
    });
  });

  describe("callbacks.session", () => {
    it("enriches session with DB user data when email is present", async () => {
      const dbUser = {
        id: "u1",
        email: "a@b.com",
        name: "Alice",
        role: "user",
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const prisma = makePrisma(dbUser);
      const config = buildConfig(makeConfig(), prisma, makeAuthService(), makeSubscriptionService());

      const session = { user: { email: "a@b.com" } };
      const result = await config.callbacks?.session?.({ session } as any);

      expect((result as any).user.id).toBe("u1");
    });

    it("returns session unchanged when no email in session user", async () => {
      const config = buildConfig(makeConfig(), makePrisma(null), makeAuthService(), makeSubscriptionService());

      const session = { user: {} };
      const result = await config.callbacks?.session?.({ session } as any);

      expect(result).toBe(session);
    });
  });

  describe("callbacks.redirect", () => {
    it("returns cors.origin in non-production environment", () => {
      const config = buildConfig(
        makeConfig({ nodeEnv: "test" } as unknown as Partial<AppConfigService>),
        makePrisma(),
        makeAuthService(),
        makeSubscriptionService(),
      );
      const result = config.callbacks?.redirect?.({ url: "https://other.com" } as any);
      expect(result).toBe("https://example.com");
    });

    it("returns url unchanged in production", () => {
      const config = buildConfig(
        makeConfig({ nodeEnv: "production" } as unknown as Partial<AppConfigService>),
        makePrisma(),
        makeAuthService(),
        makeSubscriptionService(),
      );
      const result = config.callbacks?.redirect?.({ url: "https://other.com" } as any);
      expect(result).toBe("https://other.com");
    });
  });

  describe("events.signOut (federated logout)", () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({ ok: true } as Response);
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it("calls Keycloak end-session endpoint when refreshToken is present", async () => {
      const config = buildConfig(makeConfig(), makePrisma(), makeAuthService(), makeSubscriptionService());

      await config.events?.signOut?.({ token: { refreshToken: "rt-123" } } as any);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/protocol/openid-connect/logout"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("does not call fetch when no refreshToken", async () => {
      const config = buildConfig(makeConfig(), makePrisma(), makeAuthService(), makeSubscriptionService());

      await config.events?.signOut?.({ token: {} } as any);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("does not throw when fetch fails", async () => {
      fetchSpy.mockRejectedValue(new Error("network error"));
      const config = buildConfig(makeConfig(), makePrisma(), makeAuthService(), makeSubscriptionService());

      await expect(config.events?.signOut?.({ token: { refreshToken: "rt-123" } } as any)).resolves.not.toThrow();
    });
  });
});
