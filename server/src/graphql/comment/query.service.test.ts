
import { CommentQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { CommentObject } from "./object.service";
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
    inputType: jest.fn(() => "inputType"),
    addScalarType: jest.fn(),
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeCommentObject(): CommentObject {
  return { CommentFields: "CommentFields" } as unknown as CommentObject;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique", UserOrderBy: "UserOrderBy" } as unknown as UserQuery;
}

function makePrisma(commentData: unknown = []) {
  return {
    prisma: {
      comment: {
        findMany: jest.fn().mockResolvedValue(commentData),
        findUniqueOrThrow: jest.fn().mockResolvedValue(commentData),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("CommentQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("readComments resolver", () => {
    it("calls prisma.comment.findMany and returns results", async () => {
      const comments = [{ id: "c1", message: "Hello" }];
      const prisma = makePrisma(comments);
      new CommentQuery(makeBuilder(), prisma, makeCommentObject(), makeUserQuery());

      const resolve = resolvers["readComments"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, {});

      expect(prisma.prisma.comment.findMany).toHaveBeenCalled();
      expect(result).toEqual(comments);
    });

    it("passes where filter to findMany", async () => {
      const prisma = makePrisma([]);
      new CommentQuery(makeBuilder(), prisma, makeCommentObject(), makeUserQuery());

      const resolve = resolvers["readComments"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { message: { contains: "hi" } }, orderBy: null, paging: null, distinct: null }, {});

      expect(prisma.prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { message: { contains: "hi" } } }),
      );
    });
  });

  describe("countComments resolver", () => {
    it("calls prisma.comment.count and returns count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.comment.count as jest.Mock).mockResolvedValue(4);
      new CommentQuery(makeBuilder(), prisma, makeCommentObject(), makeUserQuery());

      const resolve = resolvers["countComments"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: null }, {});

      expect(prisma.prisma.comment.count).toHaveBeenCalled();
      expect(result).toBe(4);
    });

    it("returns 0 when no comments match", async () => {
      const prisma = makePrisma();
      (prisma.prisma.comment.count as jest.Mock).mockResolvedValue(0);
      new CommentQuery(makeBuilder(), prisma, makeCommentObject(), makeUserQuery());

      const resolve = resolvers["countComments"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: { message: { equals: "nothing" } } }, {});

      expect(result).toBe(0);
    });
  });

  describe("readComment resolver", () => {
    it("calls prisma.comment.findUniqueOrThrow with where arg", async () => {
      const comment = { id: "c1", message: "Hello" };
      const prisma = makePrisma();
      (prisma.prisma.comment.findUniqueOrThrow as jest.Mock).mockResolvedValue(comment);
      new CommentQuery(makeBuilder(), prisma, makeCommentObject(), makeUserQuery());

      const resolve = resolvers["readComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: { id: "c1" } }, {});

      expect(prisma.prisma.comment.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "c1" } }),
      );
      expect(result).toEqual(comment);
    });
  });

  describe("pageComment resolver", () => {
    it("calls prisma.comment.findMany and returns results", async () => {
      const comments = [{ id: "c1" }];
      const prisma = makePrisma(comments);
      new CommentQuery(makeBuilder(), prisma, makeCommentObject(), makeUserQuery());

      const resolve = resolvers["pageComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null }, {});

      expect(prisma.prisma.comment.findMany).toHaveBeenCalled();
      expect(result).toEqual(comments);
    });
  });

  describe("groupComments resolver", () => {
    it("calls prisma.comment.groupBy with by arg", async () => {
      const prisma = makePrisma();
      (prisma.prisma.comment.groupBy as jest.Mock).mockResolvedValue([{ userId: "u1", _count: 5 }]);
      new CommentQuery(makeBuilder(), prisma, makeCommentObject(), makeUserQuery());

      const resolve = resolvers["groupComments"] as (r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve(null, { by: ["userId"], where: null, aggregate: null }, {});

      expect(prisma.prisma.comment.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ["userId"] }),
      );
    });
  });
});
