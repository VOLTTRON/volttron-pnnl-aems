 
jest.mock("passport-local", () => ({
  Strategy: class MockLocalStrategy {
    constructor(_opts: unknown) {}
  },
}));

jest.mock("@nestjs/passport", () => ({
  PassportStrategy: (Strategy: new (...args: unknown[]) => unknown) => Strategy,
}));

jest.mock("@node-rs/bcrypt", () => ({
  compare: jest.fn(),
}));

jest.mock("@auth/express/providers/credentials", () => ({
  default: jest.fn(() => ({ id: "credentials", type: "credentials" })),
}));

import { compare } from "@node-rs/bcrypt";
import { LocalPassportService } from "./local.service";
import { AuthService } from "@/auth/auth.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";

const mockCompare = compare as jest.MockedFunction<typeof compare>;

function makeAuthService(): AuthService {
  return { registerProvider: jest.fn() } as unknown as AuthService;
}

function makePrisma(user: unknown): PrismaService {
  return {
    prisma: {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
    },
  } as unknown as PrismaService;
}

function makeConfig(): AppConfigService {
  return {} as AppConfigService;
}

describe("LocalPassportService.validate", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns Express.User when credentials are valid", async () => {
    const dbUser = { id: "1", email: "a@b.com", password: "hashed", roles: [] };
    const service = new LocalPassportService(makeAuthService(), makeConfig(), makePrisma(dbUser));
    mockCompare.mockResolvedValue(true as never);

    const result = await service.validate("a@b.com", "password");

    expect(result).not.toBeNull();
    expect(mockCompare).toHaveBeenCalledWith("password", "hashed");
  });

  it("returns null when password does not match", async () => {
    const dbUser = { id: "1", email: "a@b.com", password: "hashed", roles: [] };
    const service = new LocalPassportService(makeAuthService(), makeConfig(), makePrisma(dbUser));
    mockCompare.mockResolvedValue(false as never);

    const result = await service.validate("a@b.com", "wrongpassword");

    expect(result).toBeNull();
  });

  it("returns null when user does not exist", async () => {
    const service = new LocalPassportService(makeAuthService(), makeConfig(), makePrisma(null));
    mockCompare.mockResolvedValue(false as never);

    const result = await service.validate("unknown@b.com", "password");

    expect(result).toBeNull();
    // compare is still called with empty string to prevent timing attacks
    expect(mockCompare).toHaveBeenCalledWith("password", "");
  });

  it("still calls compare when user is null (timing attack prevention)", async () => {
    const service = new LocalPassportService(makeAuthService(), makeConfig(), makePrisma(null));
    mockCompare.mockResolvedValue(false as never);

    await service.validate("x@y.com", "any");

    expect(mockCompare).toHaveBeenCalled();
  });

  it("registers itself with AuthService on construction", () => {
    const authService = makeAuthService();
    new LocalPassportService(authService, makeConfig(), makePrisma(null));
    expect(authService.registerProvider).toHaveBeenCalled();
  });
});
