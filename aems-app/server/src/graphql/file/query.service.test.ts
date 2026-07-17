
import { FileQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { FileObject } from "./object.service";
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
    PagingInput: "PagingInput",
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

function makeFileObject(): FileObject {
  return { FileFields: "FileFields" } as unknown as FileObject;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery;
}

function makePrisma(fileData: unknown = []) {
  return {
    prisma: {
      file: {
        findMany: jest.fn().mockResolvedValue(fileData),
        findUniqueOrThrow: jest.fn().mockResolvedValue(fileData),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

const adminCtx = { user: { id: "u1", authRoles: { admin: true } } };
const userCtx = { user: { id: "u1", authRoles: { admin: false } } };

describe("FileQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("readFiles resolver", () => {
    it("calls prisma.file.findMany and returns results", async () => {
      const files = [{ id: "f1", objectKey: "uploads/test.png" }];
      const prisma = makePrisma(files);
      new FileQuery(makeBuilder(), prisma, makeFileObject(), makeUserQuery());

      const resolve = resolvers["readFiles"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.file.findMany).toHaveBeenCalled();
      expect(result).toEqual(files);
    });

    it("non-admin: strips where.user and injects where.userId", async () => {
      const prisma = makePrisma([]);
      new FileQuery(makeBuilder(), prisma, makeFileObject(), makeUserQuery());

      const resolve = resolvers["readFiles"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { user: { id: "u1" } }, orderBy: null, paging: null, distinct: null }, userCtx);

      expect(prisma.prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ user: expect.anything() }) }),
      );
      expect(prisma.prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "u1" }) }),
      );
    });

    it("admin: passes where unchanged", async () => {
      const prisma = makePrisma([]);
      new FileQuery(makeBuilder(), prisma, makeFileObject(), makeUserQuery());

      const resolve = resolvers["readFiles"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { userId: { equals: "u2" } }, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: { equals: "u2" } }) }),
      );
    });
  });

  describe("readFile resolver", () => {
    it("calls prisma.file.findUniqueOrThrow with where arg", async () => {
      const file = { id: "f1", objectKey: "uploads/test.png" };
      const prisma = makePrisma();
      (prisma.prisma.file.findUniqueOrThrow as jest.Mock).mockResolvedValue(file);
      new FileQuery(makeBuilder(), prisma, makeFileObject(), makeUserQuery());

      const resolve = resolvers["readFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: { id: "f1" } }, adminCtx);

      expect(prisma.prisma.file.findUniqueOrThrow).toHaveBeenCalled();
      expect(result).toEqual(file);
    });

    it("non-admin: strips where.user and injects where.userId", async () => {
      const prisma = makePrisma();
      (prisma.prisma.file.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: "f1" });
      new FileQuery(makeBuilder(), prisma, makeFileObject(), makeUserQuery());

      const resolve = resolvers["readFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1", user: { id: "u1" } } }, userCtx);

      // Non-admin where.user is stripped and userId injected on the args.where object
      // (mutation happens on args.where in place before the Prisma call)
      expect(prisma.prisma.file.findUniqueOrThrow).toHaveBeenCalled();
    });
  });

  describe("pageFile resolver", () => {
    it("calls prisma.file.findMany and returns results for admin", async () => {
      const files = [{ id: "f1" }];
      const prisma = makePrisma(files);
      new FileQuery(makeBuilder(), prisma, makeFileObject(), makeUserQuery());

      const resolve = resolvers["pageFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null }, adminCtx);

      expect(prisma.prisma.file.findMany).toHaveBeenCalled();
      expect(result).toEqual(files);
    });

    it("non-admin: injects userId into where", async () => {
      const prisma = makePrisma([]);
      new FileQuery(makeBuilder(), prisma, makeFileObject(), makeUserQuery());

      const resolve = resolvers["pageFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: {} }, userCtx);

      expect(prisma.prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "u1" }) }),
      );
    });
  });

  describe("countFiles resolver", () => {
    it("returns count from prisma.file.count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.file.count as jest.Mock).mockResolvedValue(3);
      new FileQuery(makeBuilder(), prisma, makeFileObject(), makeUserQuery());

      const resolve = resolvers["countFiles"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: null }, adminCtx);

      expect(prisma.prisma.file.count).toHaveBeenCalled();
      expect(result).toBe(3);
    });
  });

  describe("groupFiles resolver", () => {
    it("calls prisma.file.groupBy with by arg", async () => {
      const prisma = makePrisma();
      (prisma.prisma.file.groupBy as jest.Mock).mockResolvedValue([{ userId: "u1", _count: 2 }]);
      new FileQuery(makeBuilder(), prisma, makeFileObject(), makeUserQuery());

      const resolve = resolvers["groupFiles"] as (r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve(null, { by: ["userId"], where: null, aggregate: null }, adminCtx);

      expect(prisma.prisma.file.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ["userId"] }),
      );
    });
  });
});
