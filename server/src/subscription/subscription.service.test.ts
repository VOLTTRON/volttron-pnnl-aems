 
 
 

import { Logger } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";

jest.mock("graphql-redis-subscriptions", () => ({
  RedisPubSub: jest.fn().mockImplementation(() => ({
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(1),
    unsubscribe: jest.fn(),
    asyncIterator: jest.fn().mockReturnValue({}),
    asyncIterableIterator: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock("@/prisma", () => ({
  PrismaPubSub: jest.fn().mockImplementation(() => ({
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(1),
    unsubscribe: jest.fn(),
    asyncIterator: jest.fn().mockReturnValue({}),
    asyncIterableIterator: jest.fn().mockReturnValue({}),
  })),
}));

function makePrisma(): PrismaService {
  return { prisma: {} } as unknown as PrismaService;
}

function makeConfig(pubsub: string, overrides: Partial<AppConfigService> = {}): AppConfigService {
  return {
    graphql: { pubsub },
    redis: { host: "localhost", port: 6379 },
    nodeEnv: "test",
    log: { throttle: { enabled: false, debounce: {} } },
    ...overrides,
  } as unknown as AppConfigService;
}

describe("SubscriptionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor — pubsub provider selection", () => {
    it("creates an in-memory pubsub when pubsub is 'memory'", () => {
      const { RedisPubSub } = jest.requireMock("graphql-redis-subscriptions");
      new SubscriptionService(makePrisma(), makeConfig("memory"));
      expect(RedisPubSub).not.toHaveBeenCalled();
    });

    it("creates an in-memory pubsub when pubsub is empty string", () => {
      const { RedisPubSub } = jest.requireMock("graphql-redis-subscriptions");
      new SubscriptionService(makePrisma(), makeConfig(""));
      expect(RedisPubSub).not.toHaveBeenCalled();
    });

    it("creates a RedisPubSub when pubsub is 'redis'", () => {
      const { RedisPubSub } = jest.requireMock("graphql-redis-subscriptions");
      new SubscriptionService(makePrisma(), makeConfig("redis"));
      expect(RedisPubSub).toHaveBeenCalled();
    });

    it("creates a RedisPubSub when pubsub is 'ioredis'", () => {
      const { RedisPubSub } = jest.requireMock("graphql-redis-subscriptions");
      new SubscriptionService(makePrisma(), makeConfig("ioredis"));
      expect(RedisPubSub).toHaveBeenCalled();
    });

    it("creates a PrismaPubSub when pubsub is 'prisma'", () => {
      const { PrismaPubSub } = jest.requireMock("@/prisma");
      new SubscriptionService(makePrisma(), makeConfig("prisma"));
      expect(PrismaPubSub).toHaveBeenCalled();
    });

    it("creates a PrismaPubSub when pubsub is 'database'", () => {
      const { PrismaPubSub } = jest.requireMock("@/prisma");
      new SubscriptionService(makePrisma(), makeConfig("database"));
      expect(PrismaPubSub).toHaveBeenCalled();
    });

    it("falls back to in-memory for unknown pubsub value", () => {
      const { RedisPubSub } = jest.requireMock("graphql-redis-subscriptions");
      const { PrismaPubSub } = jest.requireMock("@/prisma");
      new SubscriptionService(makePrisma(), makeConfig("unknown-provider"));
      expect(RedisPubSub).not.toHaveBeenCalled();
      expect(PrismaPubSub).not.toHaveBeenCalled();
    });
  });

  describe("publish delegates to instance", () => {
    it("calls instance.publish with topic and payload", async () => {
      const service = new SubscriptionService(makePrisma(), makeConfig("memory"));
      const payload = { topic: "Banner" as const, id: "b1", mutation: "Created" as any };
      await service.publish("Banner", payload);
      // No error thrown = delegation succeeded (in-memory PubSub accepts all calls)
    });
  });

  describe("subscribe delegates to instance", () => {
    it("calls instance.subscribe and returns a subscription id", async () => {
      const service = new SubscriptionService(makePrisma(), makeConfig("memory"));
      const id = await service.subscribe("Banner", jest.fn(), {});
      expect(typeof id).toBe("number");
    });
  });

  describe("unsubscribe delegates to instance", () => {
    it("calls instance.unsubscribe without throwing after subscribing", async () => {
      const service = new SubscriptionService(makePrisma(), makeConfig("memory"));
      const subId = await service.subscribe("Banner", jest.fn(), {});
      expect(() => service.unsubscribe(subId)).not.toThrow();
    });
  });

  describe("asyncIterator delegates to instance", () => {
    it("returns an async iterator for a trigger string", () => {
      const service = new SubscriptionService(makePrisma(), makeConfig("memory"));
      const iter = service.asyncIterator("Banner");
      expect(iter).toBeDefined();
    });
  });

  describe("production warning for in-memory pubsub", () => {
    it("logs a warning when nodeEnv is production and pubsub is memory", () => {
      const warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
      new SubscriptionService(makePrisma(), makeConfig("memory", { nodeEnv: "production" } as any));
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("in-memory"),
      );
      warnSpy.mockRestore();
    });

    it("does not warn when nodeEnv is production and pubsub is redis", () => {
      const warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
      new SubscriptionService(makePrisma(), makeConfig("redis", { nodeEnv: "production" } as any));
      // warn may be called for other reasons, but not the in-memory warning
      const inMemoryWarns = warnSpy.mock.calls.filter((args) =>
        typeof args[0] === "string" && args[0].includes("in-memory"),
      );
      expect(inMemoryWarns).toHaveLength(0);
      warnSpy.mockRestore();
    });

    it("does not warn when nodeEnv is test and pubsub is memory", () => {
      const warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
      new SubscriptionService(makePrisma(), makeConfig("memory"));
      const inMemoryWarns = warnSpy.mock.calls.filter((args) =>
        typeof args[0] === "string" && args[0].includes("in-memory"),
      );
      expect(inMemoryWarns).toHaveLength(0);
      warnSpy.mockRestore();
    });
  });

  describe("Redis connection options passthrough", () => {
    it("passes host and port to RedisPubSub", () => {
      const { RedisPubSub } = jest.requireMock("graphql-redis-subscriptions");
      new SubscriptionService(
        makePrisma(),
        makeConfig("redis", { redis: { host: "redis.internal", port: 6380 } } as any),
      );
      expect(RedisPubSub).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({ host: "redis.internal", port: 6380 }),
        }),
      );
    });

    it("passes username and password when configured", () => {
      const { RedisPubSub } = jest.requireMock("graphql-redis-subscriptions");
      new SubscriptionService(
        makePrisma(),
        makeConfig("redis", {
          redis: { host: "localhost", port: 6379, username: "user1", password: "secret" },
        } as any),
      );
      expect(RedisPubSub).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({ username: "user1", password: "secret" }),
        }),
      );
    });

    it("passes db index when configured", () => {
      const { RedisPubSub } = jest.requireMock("graphql-redis-subscriptions");
      new SubscriptionService(
        makePrisma(),
        makeConfig("redis", {
          redis: { host: "localhost", port: 6379, db: 2 },
        } as any),
      );
      expect(RedisPubSub).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({ db: 2 }),
        }),
      );
    });

    it("omits username, password, db when not configured", () => {
      const { RedisPubSub } = jest.requireMock("graphql-redis-subscriptions");
      new SubscriptionService(makePrisma(), makeConfig("redis"));
      const callArg = RedisPubSub.mock.calls[0][0] as { connection: Record<string, unknown> };
      expect(callArg.connection).not.toHaveProperty("username");
      expect(callArg.connection).not.toHaveProperty("password");
      expect(callArg.connection).not.toHaveProperty("db");
    });
  });
});
