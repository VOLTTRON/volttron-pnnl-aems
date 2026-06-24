
import { AccountQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { AccountObject } from "./object.service";
import { UserQuery } from "../user/query.service";
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

function makeAccountObject(): AccountObject {
  return { AccountFields: "AccountFields" } as unknown as AccountObject;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique", UserOrderBy: "UserOrderBy" } as unknown as UserQuery;
}

function makePrisma(accountData: unknown = []) {
  return {
    prisma: {
      account: {
        findMany: jest.fn().mockResolvedValue(accountData),
        findUniqueOrThrow: jest.fn().mockResolvedValue(accountData),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

const adminCtx = { user: { id: "u1", authRoles: { admin: true } } };
const userCtx = { user: { id: "u1", authRoles: { admin: false } } };

describe("AccountQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("readAccounts resolver", () => {
    it("calls prisma.account.findMany and returns results", async () => {
      const accounts = [{ id: "a1", type: "oauth" }];
      const prisma = makePrisma(accounts);
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["readAccounts"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.account.findMany).toHaveBeenCalled();
      expect(result).toEqual(accounts);
    });

    it("non-admin: strips where.user and injects where.userId", async () => {
      const prisma = makePrisma([]);
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["readAccounts"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { user: { id: "u1" } }, orderBy: null, paging: null, distinct: null }, userCtx);

      expect(prisma.prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ user: expect.anything() }) }),
      );
      expect(prisma.prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "u1" }) }),
      );
    });

    it("admin: passes where unchanged", async () => {
      const prisma = makePrisma([]);
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["readAccounts"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { type: { equals: "oauth" } }, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: { equals: "oauth" } } }),
      );
    });
  });

  describe("countAccounts resolver", () => {
    it("returns count from prisma.account.count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.account.count as jest.Mock).mockResolvedValue(5);
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["countAccounts"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: null }, adminCtx);

      expect(prisma.prisma.account.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it("non-admin: filters count by userId", async () => {
      const prisma = makePrisma();
      (prisma.prisma.account.count as jest.Mock).mockResolvedValue(2);
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["countAccounts"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      await resolve(null, { where: { user: { id: "u1" } } }, userCtx);

      expect(prisma.prisma.account.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "u1" }) }),
      );
    });
  });

  describe("readAccount resolver", () => {
    it("calls prisma.account.findUniqueOrThrow with where arg", async () => {
      const account = { id: "a1", type: "oauth" };
      const prisma = makePrisma();
      (prisma.prisma.account.findUniqueOrThrow as jest.Mock).mockResolvedValue(account);
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["readAccount"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: { id: "a1" } }, adminCtx);

      expect(prisma.prisma.account.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "a1" } }),
      );
      expect(result).toEqual(account);
    });

    it("non-admin: strips where.user", async () => {
      const prisma = makePrisma();
      (prisma.prisma.account.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: "a1" });
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["readAccount"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "a1", user: { id: "u1" } } }, userCtx);

      expect(prisma.prisma.account.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ user: expect.anything() }) }),
      );
    });
  });

  describe("pageAccount resolver", () => {
    it("calls prisma.account.findMany and returns results", async () => {
      const accounts = [{ id: "a1" }];
      const prisma = makePrisma(accounts);
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["pageAccount"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null }, adminCtx);

      expect(prisma.prisma.account.findMany).toHaveBeenCalled();
      expect(result).toEqual(accounts);
    });

    it("non-admin: injects userId into where", async () => {
      const prisma = makePrisma([]);
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["pageAccount"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { user: { id: "u1" } } }, userCtx);

      expect(prisma.prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "u1" }) }),
      );
    });
  });

  describe("groupAccounts resolver", () => {
    it("calls prisma.account.groupBy with by arg", async () => {
      const prisma = makePrisma();
      (prisma.prisma.account.groupBy as jest.Mock).mockResolvedValue([{ provider: "github", _count: 3 }]);
      new AccountQuery(makeBuilder(), prisma, makeAccountObject(), makeUserQuery());

      const resolve = resolvers["groupAccounts"] as (r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve(null, { by: ["provider"], where: null, aggregate: null }, adminCtx);

      expect(prisma.prisma.account.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ["provider"] }),
      );
    });
  });
});
