
import { LogMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { LogQuery } from "./query.service";
import { LogObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown) => unknown> = {};

function makeMockT() {
  return {
    prismaField: jest.fn((opts: any) => opts),
    field: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    prismaCreate: jest.fn(() => "LogCreate"),
    prismaUpdate: jest.fn(() => "LogUpdate"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeLogObject(): LogObject {
  return { LogType: "LogType" } as unknown as LogObject;
}

function makeLogQuery(): LogQuery {
  return { LogWhereUnique: "LogWhereUnique" } as unknown as LogQuery;
}

function makePrisma(returnLog: object = { id: "l1", message: "test" }) {
  return {
    prisma: {
      log: {
        create: jest.fn().mockResolvedValue(returnLog),
        update: jest.fn().mockResolvedValue(returnLog),
        delete: jest.fn().mockResolvedValue(returnLog),
      },
    },
  } as unknown as PrismaService;
}

function makeSubscription() {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionService;
}

describe("LogMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("createLog resolver", () => {
    it("prepends [web-ui]: to the message and calls prisma.log.create", async () => {
      const prisma = makePrisma({ id: "l1", message: "[web-ui]: hello" });
      const sub = makeSubscription();
      new LogMutation(makeBuilder(), prisma, sub, makeLogObject(), makeLogQuery());

      const resolve = resolvers["createLog"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { message: "hello", type: "Info" } });

      expect(prisma.prisma.log.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ message: "[web-ui]: hello" }) }),
      );
    });

    it("does not prepend prefix when message is empty/null", async () => {
      const prisma = makePrisma({ id: "l1", message: null });
      const sub = makeSubscription();
      new LogMutation(makeBuilder(), prisma, sub, makeLogObject(), makeLogQuery());

      const resolve = resolvers["createLog"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { type: "Info" } });

      expect(prisma.prisma.log.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.not.objectContaining({ message: expect.stringContaining("[web-ui]") }) }),
      );
    });

    it("publishes a Log subscription event after create", async () => {
      const log = { id: "l1", message: "[web-ui]: hello" };
      const prisma = makePrisma(log);
      const sub = makeSubscription();
      new LogMutation(makeBuilder(), prisma, sub, makeLogObject(), makeLogQuery());

      const resolve = resolvers["createLog"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { message: "hello", type: "Info" } });

      expect(sub.publish).toHaveBeenCalledTimes(1);
      expect(sub.publish).toHaveBeenCalledWith("Log", expect.objectContaining({ id: "l1" }));
    });
  });

  describe("updateLog resolver", () => {
    it("calls prisma.log.update with where and data", async () => {
      const prisma = makePrisma({ id: "l1", message: "updated" });
      const sub = makeSubscription();
      new LogMutation(makeBuilder(), prisma, sub, makeLogObject(), makeLogQuery());

      const resolve = resolvers["updateLog"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "l1" }, update: { message: "updated" } });

      expect(prisma.prisma.log.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "l1" }, data: { message: "updated" } }),
      );
    });

    it("publishes two subscription events after update", async () => {
      const log = { id: "l1", message: "updated" };
      const prisma = makePrisma(log);
      const sub = makeSubscription();
      new LogMutation(makeBuilder(), prisma, sub, makeLogObject(), makeLogQuery());

      const resolve = resolvers["updateLog"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "l1" }, update: { message: "updated" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Log", expect.objectContaining({ id: "l1" }));
      expect(sub.publish).toHaveBeenCalledWith("Log/l1", expect.objectContaining({ id: "l1" }));
    });
  });

  describe("deleteLog resolver", () => {
    it("calls prisma.log.delete with where arg", async () => {
      const prisma = makePrisma({ id: "l1" });
      const sub = makeSubscription();
      new LogMutation(makeBuilder(), prisma, sub, makeLogObject(), makeLogQuery());

      const resolve = resolvers["deleteLog"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "l1" } });

      expect(prisma.prisma.log.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "l1" } }),
      );
    });

    it("publishes two subscription events after delete", async () => {
      const log = { id: "l1" };
      const prisma = makePrisma(log);
      const sub = makeSubscription();
      new LogMutation(makeBuilder(), prisma, sub, makeLogObject(), makeLogQuery());

      const resolve = resolvers["deleteLog"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "l1" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Log", expect.objectContaining({ id: "l1" }));
      expect(sub.publish).toHaveBeenCalledWith("Log/l1", expect.objectContaining({ id: "l1" }));
    });
  });
});
