
import { UserQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { UserObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown, ctx: unknown) => unknown> = {};

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
    prismaWhereUnique: jest.fn(() => "whereUnique"),
    prismaWhere: jest.fn(() => "where"),
    prismaOrderBy: jest.fn(() => "orderBy"),
    prismaFilter: jest.fn(() => "filter"),
    inputType: jest.fn(() => "inputType"),
    addScalarType: jest.fn(),
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeUserObject(): UserObject {
  return { UserFields: "UserFields", UserPreferences: "UserPreferences" } as unknown as UserObject;
}

function makePrisma(userData: unknown = []) {
  return {
    prisma: {
      user: {
        findMany: jest.fn().mockResolvedValue(userData),
        findUniqueOrThrow: jest.fn().mockResolvedValue(userData),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

const adminCtx = { user: { id: "u1", authRoles: { admin: true } } };

describe("UserQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("readUsers resolver", () => {
    it("calls prisma.user.findMany and returns results", async () => {
      const users = [{ id: "u1", email: "a@b.com" }];
      const prisma = makePrisma(users);
      new UserQuery(makeBuilder(), prisma, makeUserObject());

      const resolve = resolvers["readUsers"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe("readUser resolver", () => {
    it("calls prisma.user.findUniqueOrThrow with where arg", async () => {
      const user = { id: "u1", email: "a@b.com" };
      const prisma = makePrisma();
      (prisma.prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(user);
      new UserQuery(makeBuilder(), prisma, makeUserObject());

      const resolve = resolvers["readUser"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: { id: "u1" } }, adminCtx);

      expect(prisma.prisma.user.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" } }),
      );
      expect(result).toEqual(user);
    });
  });

  describe("pageUser resolver", () => {
    it("calls prisma.user.findMany and returns results", async () => {
      const users = [{ id: "u1" }];
      const prisma = makePrisma(users);
      new UserQuery(makeBuilder(), prisma, makeUserObject());

      const resolve = resolvers["pageUser"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null }, adminCtx);

      expect(prisma.prisma.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe("countUsers resolver", () => {
    it("returns count from prisma.user.count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.user.count as jest.Mock).mockResolvedValue(7);
      new UserQuery(makeBuilder(), prisma, makeUserObject());

      const resolve = resolvers["countUsers"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: null }, adminCtx);

      expect(prisma.prisma.user.count).toHaveBeenCalled();
      expect(result).toBe(7);
    });
  });

  describe("groupUsers resolver", () => {
    it("calls prisma.user.groupBy with by arg", async () => {
      const prisma = makePrisma();
      (prisma.prisma.user.groupBy as jest.Mock).mockResolvedValue([{ role: "admin", _count: 1 }]);
      new UserQuery(makeBuilder(), prisma, makeUserObject());

      const resolve = resolvers["groupUsers"] as (r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve(null, { by: ["role"], where: null, aggregate: null }, adminCtx);

      expect(prisma.prisma.user.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ["role"] }),
      );
    });
  });
});
