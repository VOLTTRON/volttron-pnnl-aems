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
  });
});
