import { KeycloakAuthjsService, KeycloakPassportService } from "./keycloak.service";
import { AuthService } from "@/auth/auth.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { JwtService } from "@nestjs/jwt";

// ── Mocks for heavy passport-oauth2 chain ─────────────────────────────────
jest.mock("passport-oauth2", () => {
  class Strategy {
     
    constructor(_opts: any, _verify?: any) {}
     
    static call(_ctx: any, ..._args: any[]) {}
  }
  return { Strategy };
});

jest.mock("@auth/express/providers/keycloak", () => {
  const fn = jest.fn().mockReturnValue({ id: "keycloak", name: "Keycloak" });
  return { __esModule: true, default: fn };
});

function makeConfig(overrides: object = {}): AppConfigService {
  return {
    auth: { providers: ["keycloak"], framework: "passport" },
    keycloak: {
      authUrl: "https://kc/auth",
      tokenUrl: "https://kc/token",
      callbackUrl: "https://app/callback",
      clientId: "client-id",
      clientSecret: "secret",
      scope: "openid",
      checks: ["pkce"],
      passRoles: false,
      defaultRole: "user",
      userinfoUrl: "https://kc/userinfo",
      issuerUrl: "https://kc",
      wellKnownUrl: "https://kc/.well-known",
    },
    ...overrides,
  } as unknown as AppConfigService;
}

function makeAuthService(): jest.Mocked<AuthService> {
  return {
    registerProvider: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;
}

function makePrisma(userRow: object | null = null) {
  return {
    prisma: {
      user: {
        findFirst: jest.fn().mockResolvedValue(userRow),
        create: jest.fn(),
        update: jest.fn(),
      },
      account: {
        create: jest.fn(),
        update: jest.fn(),
      },
    },
  } as unknown as PrismaService;
}

function makeSubscription(): jest.Mocked<SubscriptionService> {
  return { publish: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<SubscriptionService>;
}

function makeJwt(): jest.Mocked<JwtService> {
  return { decode: jest.fn().mockReturnValue({ realm_access: { roles: ["user"] } }) } as unknown as jest.Mocked<JwtService>;
}

const PROFILE = {
  id: "kc-sub-1",
  sub: "kc-sub-1",
  name: "Test User",
  email: "test@example.com",
  email_verified: true,
};

const USER_ROW = {
  id: "db-user-1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: new Date(),
  role: "user",
  accounts: [{ id: "acct-1", provider: "keycloak" }],
};

describe("KeycloakAuthjsService", () => {
  it("registers itself as a provider on construction", () => {
    const authService = makeAuthService();
    const service = new KeycloakAuthjsService(authService, makeConfig());
    expect(authService.registerProvider).toHaveBeenCalledWith(service);
  });

  it("create() returns an Auth.js Keycloak provider", () => {
    const service = new KeycloakAuthjsService(makeAuthService(), makeConfig());
    const provider = service.create();
    expect(provider).toBeDefined();
  });

  it("has name=keycloak, label=Keycloak", () => {
    const service = new KeycloakAuthjsService(makeAuthService(), makeConfig());
    expect(service.name).toBe("keycloak");
    expect(service.label).toBe("Keycloak");
  });
});

describe("KeycloakPassportService", () => {
  it("registers itself as a provider on construction", () => {
    const authService = makeAuthService();
    const service = new KeycloakPassportService(authService, makeConfig(), makePrisma(), makeSubscription(), makeJwt());
    expect(authService.registerProvider).toHaveBeenCalledWith(service);
  });

  describe("validate()", () => {
    it("returns a built express user when existing user is found and unchanged", async () => {
      const userRow = { ...USER_ROW };
      const prisma = makePrisma(userRow);
      // User has an account — takes the account.update path
      const updatedAccount = { id: "acct-1", user: { ...userRow, accounts: [{ id: "acct-1" }] } };
      (prisma.prisma.account.update as jest.Mock).mockResolvedValue(updatedAccount);
      const service = new KeycloakPassportService(makeAuthService(), makeConfig(), prisma, makeSubscription(), makeJwt());
      const user = await service.validate("token", "refresh", PROFILE as any);
      expect(user).toBeDefined();
      expect((user as any)?.id).toBe("db-user-1");
    });

    it("updates user when name/email has changed", async () => {
      const staleUser = { ...USER_ROW, name: "Old Name" };
      const prisma = makePrisma(staleUser);
      const updatedUser = { ...USER_ROW, accounts: [{ id: "acct-1" }] };
      (prisma.prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      const updatedAccount = { id: "acct-1", user: updatedUser };
      (prisma.prisma.account.update as jest.Mock).mockResolvedValue(updatedAccount);
      const sub = makeSubscription();
      const service = new KeycloakPassportService(makeAuthService(), makeConfig(), prisma, sub, makeJwt());
      await service.validate("token", "refresh", PROFILE as any);
      expect(prisma.prisma.user.update).toHaveBeenCalled();
    });

    it("creates a new user when none is found", async () => {
      const prisma = makePrisma(null);
      const newUser = { ...USER_ROW, accounts: [] };
      (prisma.prisma.user.create as jest.Mock).mockResolvedValue(newUser);
      const created = { id: "acct-new", user: { ...newUser, accounts: [{ id: "acct-new" }] } };
      (prisma.prisma.account.create as jest.Mock).mockResolvedValue(created);
      const service = new KeycloakPassportService(makeAuthService(), makeConfig(), prisma, makeSubscription(), makeJwt());
      const user = await service.validate("token", "refresh", PROFILE as any);
      expect(prisma.prisma.user.create).toHaveBeenCalled();
      expect(user).toBeDefined();
    });

    it("updates the keycloak account token when account already exists", async () => {
      const userRow = { ...USER_ROW, accounts: [{ id: "acct-1" }] };
      const prisma = makePrisma(userRow);
      const updated = { id: "acct-1", user: { ...userRow, accounts: [{ id: "acct-1" }] } };
      (prisma.prisma.account.update as jest.Mock).mockResolvedValue(updated);
      const service = new KeycloakPassportService(makeAuthService(), makeConfig(), prisma, makeSubscription(), makeJwt());
      await service.validate("new-access-token", "new-refresh-token", PROFILE as any);
      expect(prisma.prisma.account.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ access_token: "new-access-token" }) }),
      );
    });

    it("sets emailVerified to null when email_verified is false (update path)", async () => {
      const unverifiedProfile = { ...PROFILE, email_verified: false };
      const prisma = makePrisma({ ...USER_ROW });
      const updatedUser = { ...USER_ROW, emailVerified: null, accounts: [{ id: "acct-1" }] };
      (prisma.prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prisma.prisma.account.update as jest.Mock).mockResolvedValue({ id: "acct-1", user: updatedUser });
      const service = new KeycloakPassportService(makeAuthService(), makeConfig(), prisma, makeSubscription(), makeJwt());
      await service.validate("token", "refresh", unverifiedProfile as any);
      expect(prisma.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ emailVerified: null }) }),
      );
    });

    it("sets emailVerified to null when email_verified is false (create path)", async () => {
      const unverifiedProfile = { ...PROFILE, email_verified: false };
      const prisma = makePrisma(null);
      const newUser = { ...USER_ROW, emailVerified: null, accounts: [] };
      (prisma.prisma.user.create as jest.Mock).mockResolvedValue(newUser);
      (prisma.prisma.account.create as jest.Mock).mockResolvedValue({
        id: "acct-new",
        user: { ...newUser, accounts: [{ id: "acct-new" }] },
      });
      const service = new KeycloakPassportService(makeAuthService(), makeConfig(), prisma, makeSubscription(), makeJwt());
      await service.validate("token", "refresh", unverifiedProfile as any);
      expect(prisma.prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ emailVerified: null }) }),
      );
    });

    it("includes role in user update when passRoles is true", async () => {
      const staleUser = { ...USER_ROW, name: "Old Name" };
      const prisma = makePrisma(staleUser);
      const updatedUser = { ...USER_ROW, accounts: [{ id: "acct-1" }] };
      (prisma.prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prisma.prisma.account.update as jest.Mock).mockResolvedValue({ id: "acct-1", user: updatedUser });
      const config = makeConfig({
        keycloak: {
          authUrl: "https://kc/auth",
          tokenUrl: "https://kc/token",
          callbackUrl: "https://app/callback",
          clientId: "client-id",
          clientSecret: "secret",
          scope: "openid",
          checks: ["pkce"],
          passRoles: true,
          defaultRole: "user",
          userinfoUrl: "https://kc/userinfo",
          issuerUrl: "https://kc",
          wellKnownUrl: "https://kc/.well-known",
        },
      });
      const service = new KeycloakPassportService(makeAuthService(), config, prisma, makeSubscription(), makeJwt());
      await service.validate("token", "refresh", PROFILE as any);
      expect(prisma.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: expect.any(String) }) }),
      );
    });

    it("includes role in user create when passRoles is true", async () => {
      const prisma = makePrisma(null);
      const newUser = { ...USER_ROW, accounts: [] };
      (prisma.prisma.user.create as jest.Mock).mockResolvedValue(newUser);
      (prisma.prisma.account.create as jest.Mock).mockResolvedValue({
        id: "acct-pr",
        user: { ...newUser, accounts: [{ id: "acct-pr" }] },
      });
      const config = makeConfig({
        keycloak: {
          authUrl: "https://kc/auth",
          tokenUrl: "https://kc/token",
          callbackUrl: "https://app/callback",
          clientId: "client-id",
          clientSecret: "secret",
          scope: "openid",
          checks: ["pkce"],
          passRoles: true,
          defaultRole: "user",
          userinfoUrl: "https://kc/userinfo",
          issuerUrl: "https://kc",
          wellKnownUrl: "https://kc/.well-known",
        },
      });
      const service = new KeycloakPassportService(makeAuthService(), config, prisma, makeSubscription(), makeJwt());
      await service.validate("token", "refresh", PROFILE as any);
      expect(prisma.prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: expect.any(String) }) }),
      );
    });

    it("uses profile.sub as id when profile.id is absent", async () => {
      const noIdProfile = { ...PROFILE, id: undefined };
      const prisma = makePrisma(null);
      const newUser = { ...USER_ROW, accounts: [] };
      (prisma.prisma.user.create as jest.Mock).mockResolvedValue(newUser);
      (prisma.prisma.account.create as jest.Mock).mockResolvedValue({
        id: "acct-sub",
        user: { ...newUser, accounts: [{ id: "acct-sub" }] },
      });
      const service = new KeycloakPassportService(makeAuthService(), makeConfig(), prisma, makeSubscription(), makeJwt());
      const user = await service.validate("token", "refresh", noIdProfile as any);
      expect(user).toBeDefined();
      expect(prisma.prisma.user.create).toHaveBeenCalled();
    });

    it("falls back to token email/name when profile lacks them", async () => {
      const partialProfile = { id: "kc-sub-2", sub: "kc-sub-2", email_verified: true };
      const jwt = makeJwt();
      (jwt.decode as jest.Mock).mockReturnValue({
        realm_access: { roles: ["user"] },
        email: "from@token.com",
        name: "Token Name",
      });
      const prisma = makePrisma(null);
      const newUser = { ...USER_ROW, email: "from@token.com", name: "Token Name", accounts: [] };
      (prisma.prisma.user.create as jest.Mock).mockResolvedValue(newUser);
      (prisma.prisma.account.create as jest.Mock).mockResolvedValue({
        id: "acct-tok",
        user: { ...newUser, accounts: [{ id: "acct-tok" }] },
      });
      const service = new KeycloakPassportService(makeAuthService(), makeConfig(), prisma, makeSubscription(), jwt);
      const user = await service.validate("token", "refresh", partialProfile as any);
      expect(user).toBeDefined();
      expect(prisma.prisma.user.create).toHaveBeenCalled();
    });

    it("falls back to userinfo endpoint when profile and token both lack email/name", async () => {
      const partialProfile = { id: "kc-sub-3", sub: "kc-sub-3", email_verified: true };
      const jwt = makeJwt();
      (jwt.decode as jest.Mock).mockReturnValue({ realm_access: { roles: [] } });
      const mockFetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ email: "userinfo@example.com", name: "Userinfo Name" }),
      });
      const originalFetch = global.fetch;
      global.fetch = mockFetch as unknown as typeof fetch;
      try {
        const prisma = makePrisma(null);
        const newUser = { ...USER_ROW, email: "userinfo@example.com", name: "Userinfo Name", accounts: [] };
        (prisma.prisma.user.create as jest.Mock).mockResolvedValue(newUser);
        (prisma.prisma.account.create as jest.Mock).mockResolvedValue({
          id: "acct-ui",
          user: { ...newUser, accounts: [{ id: "acct-ui" }] },
        });
        const service = new KeycloakPassportService(makeAuthService(), makeConfig(), prisma, makeSubscription(), jwt);
        const user = await service.validate("token", "refresh", partialProfile as any);
        expect(user).toBeDefined();
        expect(mockFetch).toHaveBeenCalled();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
