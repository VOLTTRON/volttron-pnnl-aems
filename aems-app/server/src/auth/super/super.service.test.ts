jest.mock("passport-local", () => ({
  Strategy: class MockLocalStrategy {
    constructor() {}
  },
}));

jest.mock("@nestjs/passport", () => ({
  PassportStrategy: (Strategy: new (...args: unknown[]) => unknown) => Strategy,
}));

jest.mock("@auth/express/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn((opts: unknown) => opts),
}));

import { SuperPassportService, SuperAuthjsService } from "./super.service";
import { AuthService } from "@/auth/auth.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";

function makeAuthService(): AuthService {
  return { registerProvider: jest.fn() } as unknown as AuthService;
}

function makeConfig(): AppConfigService {
  return {
    auth: { providers: ["super"], framework: "authjs" },
  } as unknown as AppConfigService;
}

function makePrisma(user: unknown = null): PrismaService {
  return {
    prisma: {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
    },
  } as unknown as PrismaService;
}

const baseUser = {
  id: "u1",
  email: "admin@example.com",
  name: "Admin",
  role: "",
  emailVerified: null,
  password: "hash",
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
};

describe("SuperPassportService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("registers itself with AuthService on construction", () => {
    const authService = makeAuthService();
    new SuperPassportService(authService, makeConfig(), makePrisma());
    expect(authService.registerProvider).toHaveBeenCalled();
  });

  it("returns Express.User when user is found by id", async () => {
    const service = new SuperPassportService(makeAuthService(), makeConfig(), makePrisma(baseUser));

    const result = await service.validate("u1", "irrelevant");

    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("password");
  });

  it("returns null when no user is found", async () => {
    const service = new SuperPassportService(makeAuthService(), makeConfig(), makePrisma(null));

    const result = await service.validate("unknown", "irrelevant");

    expect(result).toBeNull();
  });
});

describe("SuperAuthjsService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("registers itself with AuthService on construction", () => {
    const authService = makeAuthService();
    new SuperAuthjsService(authService, makeConfig(), makePrisma());
    expect(authService.registerProvider).toHaveBeenCalled();
  });

  it("create() returns a Credentials provider config", () => {
    const service = new SuperAuthjsService(makeAuthService(), makeConfig(), makePrisma());
    const result = service.create();
    expect(result).toBeDefined();
  });

  it("authorize returns null when email is not a string", async () => {
    const prisma = makePrisma(baseUser);
    const service = new SuperAuthjsService(makeAuthService(), makeConfig(), prisma);
    const provider = service.create() as any;

    const result = await provider.authorize({ email: 123 }, { user: { authRoles: { super: true } } });

    expect(result).toBeNull();
  });

  it("authorize returns null when user is not found", async () => {
    const service = new SuperAuthjsService(makeAuthService(), makeConfig(), makePrisma(null));
    const provider = service.create() as any;

    const result = await provider.authorize(
      { email: "nobody@example.com" },
      { user: { authRoles: { super: true } } },
    );

    expect(result).toBeNull();
  });

  it("authorize returns null when user is not authorized (super=false)", async () => {
    const service = new SuperAuthjsService(makeAuthService(), makeConfig(), makePrisma(baseUser));
    const provider = service.create() as any;

    const result = await provider.authorize(
      { email: baseUser.email },
      { user: { authRoles: { super: false } } },
    );

    expect(result).toBeNull();
  });

  it("authorize returns Express.User when user exists and is authorized", async () => {
    const service = new SuperAuthjsService(makeAuthService(), makeConfig(), makePrisma(baseUser));
    const provider = service.create() as any;

    const result = await provider.authorize(
      { email: baseUser.email },
      { user: { authRoles: { super: true } } },
    );

    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("password");
  });
});
