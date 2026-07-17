import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Request, Response } from "express";

function makeAuthService(providers: Record<string, unknown> = {}): AuthService {
  const names = Object.keys(providers);
  return {
    getProviderNames: jest.fn().mockReturnValue(names),
    getProvider: jest.fn((name: string) => providers[name]),
  } as unknown as AuthService;
}

function makePrisma(user: unknown = null, account: unknown = null): PrismaService {
  return {
    prisma: {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(user),
      },
      account: {
        findFirst: jest.fn().mockResolvedValue(account),
      },
    },
  } as unknown as PrismaService;
}

function makeConfig(overrides: Partial<AppConfigService> = {}): AppConfigService {
  return {
    auth: { framework: "authjs", providers: ["local"] },
    keycloak: {
      issuerUrl: "https://keycloak.example.com/realms/myrealm",
      clientId: "my-client",
    },
    cors: { origin: "https://example.com" },
    ...overrides,
  } as unknown as AppConfigService;
}

function makeReq(overrides: Record<string, unknown> = {}): Request {
  return {
    headers: { origin: "https://example.com" },
    logout: jest.fn((cb: (err: Error | null) => void) => cb(null)),
    ...overrides,
  } as unknown as Request;
}

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("AuthController.root", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns an empty object when no providers are registered", () => {
    const controller = new AuthController(makePrisma(), makeAuthService(), makeConfig());
    const result = controller.root();
    expect(result).toEqual({});
  });

  it("returns provider metadata for registered providers", () => {
    const provider = { name: "local", label: "Local", credentials: {}, endpoint: "/auth/local/login" };
    const controller = new AuthController(makePrisma(), makeAuthService({ local: provider }), makeConfig());

    const result = controller.root() as Record<string, unknown>;

    expect(result.local).toBeDefined();
    expect((result.local as any).name).toBe("local");
    expect((result.local as any).label).toBe("Local");
  });
});

describe("AuthController.current", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns user from Prisma when user is present", async () => {
    const dbUser = { id: "u1", email: "a@b.com", name: "Alice" };
    const prisma = makePrisma(dbUser);
    const controller = new AuthController(prisma, makeAuthService(), makeConfig());

    const result = await controller.current({ id: "u1" } as Express.User);

    expect(prisma.prisma.user.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" } }),
    );
    expect(result).toEqual(dbUser);
  });

  it("returns null when no user is present", async () => {
    const controller = new AuthController(makePrisma(), makeAuthService(), makeConfig());
    const result = await controller.current(undefined as unknown as Express.User);
    expect(result).toBeNull();
  });
});

describe("AuthController.logout", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 for non-Keycloak users", async () => {
    const prisma = makePrisma(null, null);
    const controller = new AuthController(prisma, makeAuthService(), makeConfig());
    const req = makeReq();
    const res = makeRes();

    await controller.logout(req, res, { id: "u1" } as Express.User);

    expect((res as any).status).toHaveBeenCalledWith(200);
    expect((res as any).send).toHaveBeenCalled();
  });

  it("redirects to Keycloak logout when user has keycloak account and framework=authjs", async () => {
    const keycloakAccount = { provider: "keycloak" };
    const prisma = makePrisma(null, keycloakAccount);
    const controller = new AuthController(prisma, makeAuthService(), makeConfig());
    const req = makeReq();
    const res = makeRes();

    await controller.logout(req, res, { id: "u1" } as Express.User);

    expect((res as any).redirect).toHaveBeenCalledWith(
      expect.stringContaining("/protocol/openid-connect/logout"),
    );
  });

  it("does not redirect to Keycloak when framework is not authjs", async () => {
    const keycloakAccount = { provider: "keycloak" };
    const prisma = makePrisma(null, keycloakAccount);
    const config = makeConfig({ auth: { framework: "passport", providers: [] } } as unknown as Partial<AppConfigService>);
    const controller = new AuthController(prisma, makeAuthService(), config);
    const req = makeReq();
    const res = makeRes();

    await controller.logout(req, res, { id: "u1" } as Express.User);

    expect((res as any).redirect).not.toHaveBeenCalled();
    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it("handles logout when no user is logged in", async () => {
    const controller = new AuthController(makePrisma(null, null), makeAuthService(), makeConfig());
    const req = makeReq();
    const res = makeRes();

    await controller.logout(req, res, undefined as unknown as Express.User);

    expect((res as any).status).toHaveBeenCalledWith(200);
  });

  it("includes client_id in the Keycloak logout URL", async () => {
    const keycloakAccount = { provider: "keycloak" };
    const prisma = makePrisma(null, keycloakAccount);
    const controller = new AuthController(prisma, makeAuthService(), makeConfig());
    const req = makeReq();
    const res = makeRes();

    await controller.logout(req, res, { id: "u1" } as Express.User);

    const redirectUrl = (res as any).redirect.mock.calls[0][0] as string;
    expect(redirectUrl).toContain("client_id=");
    expect(redirectUrl).toContain("post_logout_redirect_uri=");
  });
});
