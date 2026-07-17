
import { LogQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { LogObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";

// Tracks resolvers by field name
const resolvers: Record<string, (query: unknown, root: unknown, args: unknown) => unknown> = {};

function makeMockT() {
  return {
    prismaConnection: jest.fn((opts: any) => opts),
    prismaField: jest.fn((opts: any) => opts),
    field: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    StringFilter: "StringFilter",
    DateTimeFilter: "DateTimeFilter",
    PagingInput: "PagingInput",
    prismaFilter: jest.fn(() => "filter"),
    prismaWhereUnique: jest.fn(() => "whereUnique"),
    prismaWhere: jest.fn(() => "where"),
    prismaOrderBy: jest.fn(() => "orderBy"),
    inputType: jest.fn(() => "inputType"),
    addScalarType: jest.fn(),
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeLogObject(): LogObject {
  return { LogFields: "LogFields" } as unknown as LogObject;
}

function makePrisma(logData: unknown = []) {
  return {
    prisma: {
      log: {
        findMany: jest.fn().mockResolvedValue(logData),
        findUniqueOrThrow: jest.fn().mockResolvedValue(logData),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("LogQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("readLogs resolver", () => {
    it("calls prisma.log.findMany with where/orderBy/paging args", async () => {
      const prisma = makePrisma([{ id: "1" }]);
      new LogQuery(makeBuilder(), prisma, makeLogObject());

      const resolve = resolvers["readLogs"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      const result = await resolve(
        {},
        null,
        { where: { type: { equals: "ERROR" } }, orderBy: [{ createdAt: "desc" }], paging: null, distinct: null },
      );

      expect(prisma.prisma.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: { equals: "ERROR" } } }),
      );
      expect(result).toEqual([{ id: "1" }]);
    });

    it("calls findMany with empty where when no args provided", async () => {
      const prisma = makePrisma([]);
      new LogQuery(makeBuilder(), prisma, makeLogObject());

      const resolve = resolvers["readLogs"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null });

      expect(prisma.prisma.log.findMany).toHaveBeenCalled();
    });
  });

  describe("countLogs resolver", () => {
    it("calls prisma.log.count and returns the count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.log.count as jest.Mock).mockResolvedValue(42);
      new LogQuery(makeBuilder(), prisma, makeLogObject());

      const resolve = resolvers["countLogs"] as (r: unknown, args: unknown) => Promise<number>;
      const result = await resolve(null, { where: null });

      expect(prisma.prisma.log.count).toHaveBeenCalled();
      expect(result).toBe(42);
    });

    it("passes where clause to prisma.log.count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.log.count as jest.Mock).mockResolvedValue(5);
      new LogQuery(makeBuilder(), prisma, makeLogObject());

      const resolve = resolvers["countLogs"] as (r: unknown, args: unknown) => Promise<number>;
      await resolve(null, { where: { message: { contains: "error" } } });

      expect(prisma.prisma.log.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { message: { contains: "error" } } }),
      );
    });
  });

  describe("groupLogs resolver", () => {
    it("calls prisma.log.groupBy with by fields", async () => {
      const prisma = makePrisma();
      (prisma.prisma.log.groupBy as jest.Mock).mockResolvedValue([]);
      new LogQuery(makeBuilder(), prisma, makeLogObject());

      const resolve = resolvers["groupLogs"] as (r: unknown, args: unknown) => Promise<unknown>;
      await resolve(null, { by: ["type"], where: null, aggregate: null });

      expect(prisma.prisma.log.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ["type"] }),
      );
    });
  });
});
