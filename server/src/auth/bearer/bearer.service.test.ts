 
jest.mock("passport-http-bearer", () => ({
  Strategy: class MockBearerStrategy {
    constructor() {}
  },
}));

jest.mock("@nestjs/passport", () => ({
  PassportStrategy: (Strategy: new (...args: unknown[]) => unknown) => Strategy,
}));

import { BearerPassportService } from "./bearer.service";
import { AuthService } from "@/auth/auth.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

function makeAuthService(): AuthService {
  return { registerProvider: jest.fn() } as unknown as AuthService;
}

function makeConfig(framework = "authjs"): AppConfigService {
  return {
    auth: { framework, providers: ["bearer"] },
  } as AppConfigService;
}

function makePrisma(account: unknown): PrismaService {
  return {
    prisma: {
      account: {
        findFirst: jest.fn().mockResolvedValue(account),
      },
    },
  } as unknown as PrismaService;
}

function makeJwt(valid: boolean): JwtService {
  return {
    verifyAsync: jest.fn().mockResolvedValue(valid ? { sub: "user1" } : null),
  } as unknown as JwtService;
}

describe("BearerPassportService.validate", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns Express.User when JWT is valid and account exists", async () => {
    const account = { user: { id: "1", email: "a@b.com", roles: [] } };
    const service = new BearerPassportService(
      makeAuthService(),
      makeConfig(),
      makePrisma(account),
      makeJwt(true),
    );

    const result = await service.validate("valid-jwt-token");

    expect(result).not.toBeNull();
  });

  it("returns null when account is not found for the token", async () => {
    const service = new BearerPassportService(
      makeAuthService(),
      makeConfig(),
      makePrisma(null),
      makeJwt(true),
    );

    const result = await service.validate("valid-jwt-no-account");

    expect(result).toBeNull();
  });

  it("throws when JWT verification fails (no try/catch in validate)", async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockRejectedValue(new Error("invalid token")),
    } as unknown as JwtService;
    const service = new BearerPassportService(
      makeAuthService(),
      makeConfig(),
      makePrisma(null),
      jwtService,
    );

    await expect(service.validate("bad-token")).rejects.toThrow("invalid token");
  });

  it("returns null when token is not a string", async () => {
    const service = new BearerPassportService(
      makeAuthService(),
      makeConfig(),
      makePrisma(null),
      makeJwt(true),
    );

    const result = await service.validate(null);

    expect(result).toBeNull();
  });

  it("returns null when token is undefined", async () => {
    const service = new BearerPassportService(
      makeAuthService(),
      makeConfig(),
      makePrisma(null),
      makeJwt(true),
    );

    const result = await service.validate(undefined);

    expect(result).toBeNull();
  });

  it("registers itself with AuthService on construction", () => {
    const authService = makeAuthService();
    new BearerPassportService(authService, makeConfig(), makePrisma(null), makeJwt(true));
    expect(authService.registerProvider).toHaveBeenCalled();
  });
});
