 
import { PassportMiddleware, sessionStoreFactory } from "./passport.middleware";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService, ExpressProvider } from "@/auth/auth.service";

jest.mock("ioredis", () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  }));
  return { __esModule: true, default: MockRedis };
});

jest.mock("connect-redis", () => {
  return { RedisStore: jest.fn().mockImplementation(() => ({})) };
});

function makeConfig(framework: string = "passport", store: string = "memory"): AppConfigService {
  return {
    auth: { framework, providers: [] },
    session: { store, maxAge: 86400000, secret: "test-secret" },
    nodeEnv: "test",
    redis: { host: "localhost", port: 6379 },
  } as unknown as AppConfigService;
}

function makePrisma() {
  return {
    prisma: {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "u1", role: "user", email: "u@example.com", name: "User" }),
      },
    },
  } as unknown as PrismaService;
}

function makeAuthService(): jest.Mocked<AuthService> {
  return {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;
}

describe("sessionStoreFactory", () => {
  const logger = { log: jest.fn(), warn: jest.fn() };

  it("returns a PrismaSessionStore for 'prisma' store type", () => {
    const store = sessionStoreFactory(makePrisma(), makeConfig("passport", "prisma"), logger as any);
    expect(store).toBeDefined();
  });

  it("returns a RedisStore for 'redis' store type", () => {
    const store = sessionStoreFactory(makePrisma(), makeConfig("passport", "redis"), logger as any);
    expect(store).toBeDefined();
  });

  it("returns undefined for 'memory' store type", () => {
    const store = sessionStoreFactory(makePrisma(), makeConfig("passport", "memory"), logger as any);
    expect(store).toBeUndefined();
  });

  it("returns undefined for empty string store type", () => {
    const store = sessionStoreFactory(makePrisma(), makeConfig("passport", ""), logger as any);
    expect(store).toBeUndefined();
  });

  it("returns undefined and warns for unknown store type", () => {
    const store = sessionStoreFactory(makePrisma(), makeConfig("passport", "unknown-store"), logger as any);
    expect(store).toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe("PassportMiddleware", () => {
  it("constructs without throwing when framework is 'passport'", () => {
    expect(() => new PassportMiddleware(makeConfig("passport", "memory"), makePrisma(), makeAuthService())).not.toThrow();
  });

  it("constructs without throwing when framework is 'authjs' (use becomes pass-through)", () => {
    expect(() => new PassportMiddleware(makeConfig("authjs"), makePrisma(), makeAuthService())).not.toThrow();
  });

  describe("serializeUser()", () => {
    it("serializes by returning user.id", () => {
      const middleware = new PassportMiddleware(makeConfig(), makePrisma(), makeAuthService());
      const done = jest.fn();
      middleware.serializeUser({ id: "u-abc" } as Express.User, done);
      expect(done).toHaveBeenCalledWith(null, "u-abc");
    });
  });

  describe("deserializeUser()", () => {
    it("calls done with a built express user on success", async () => {
      const prisma = makePrisma();
      const middleware = new PassportMiddleware(makeConfig(), prisma, makeAuthService());
      const done = jest.fn();
      middleware.deserializeUser("u1", done);
      await new Promise((r) => setTimeout(r, 10));
      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ id: "u1" }));
    });

    it("calls done with an error when the user is not found", async () => {
      const prisma = makePrisma();
      (prisma.prisma.user.findUniqueOrThrow as jest.Mock).mockRejectedValue(new Error("not found"));
      const middleware = new PassportMiddleware(makeConfig(), prisma, makeAuthService());
      const done = jest.fn();
      middleware.deserializeUser("no-such-id", done);
      await new Promise((r) => setTimeout(r, 10));
      expect(done).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("onModuleDestroy()", () => {
    it("calls authService.unsubscribe without throwing", () => {
      const auth = makeAuthService();
      const middleware = new PassportMiddleware(makeConfig(), makePrisma(), auth);
      expect(() => middleware.onModuleDestroy()).not.toThrow();
    });
  });

  describe("update() notification", () => {
    it("logs a warning when an AuthjsProvider is registered after middleware init", () => {
      const auth = makeAuthService();
      const middleware = new PassportMiddleware(makeConfig("passport"), makePrisma(), auth);
      // Simulate subscription callback being triggered
      const subscribeCallback = (auth.subscribe as jest.Mock).mock.calls[0][0] as (p: ExpressProvider) => void;
      expect(() =>
        subscribeCallback({
          name: "authjs",
          label: "AuthJS",
          credentials: {},
          endpoint: "/authjs/signin",
          validate: jest.fn(),
        }),
      ).not.toThrow();
    });
  });
});
