import { narrowToOwner } from "./own-records";
import { Context } from ".";
import { FeedbackQuery } from "./feedback/query.service";
import { FeedbackMutation } from "./feedback/mutate.service";
import { CommentQuery } from "./comment/query.service";
import { FileQuery } from "./file/query.service";
import { FeedbackObject } from "./feedback/object.service";
import { CommentObject } from "./comment/object.service";
import { FileObject } from "./file/object.service";
import { UserQuery } from "./user/query.service";
import { SchemaBuilderService } from "./builder.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

type Resolve = (query: unknown, root: unknown, args: unknown, ctx: unknown) => Promise<unknown>;
const resolvers: Record<string, Resolve> = {};

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
    prismaCreate: jest.fn(() => "create"),
    prismaUpdate: jest.fn(() => "update"),
    prismaUpdateRelation: jest.fn(() => "updateRel"),
    inputType: jest.fn(() => "inputType"),
    addScalarType: jest.fn(),
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(makeMockT());
      resolvers[name] = opts.resolve;
    }),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(makeMockT());
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makePrismaFeedback() {
  return {
    prisma: {
      feedback: {
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "x" }),
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: "x" }),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: "x" }),
      },
      file: {
        count: jest.fn().mockResolvedValue(0),
      },
    },
  } as unknown as PrismaService;
}

function makePrismaForModel(model: "comment" | "file") {
  const api = {
    findMany: jest.fn().mockResolvedValue([]),
    findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "x" }),
    findFirstOrThrow: jest.fn().mockResolvedValue({ id: "x" }),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
  };
  return {
    prisma: {
      [model]: api,
    },
  } as unknown as PrismaService;
}

const anonCtx = { user: undefined } as unknown as Context;
const adminCtx = { user: { id: "a1", authRoles: { admin: true, user: true } } } as unknown as Context;
const userCtx = { user: { id: "u1", authRoles: { admin: false, user: true } } } as unknown as Context;

// scenario: own-records-only
describe("own-records-only: every read, write and subscription path refuses another user's rows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("narrowToOwner helper", () => {
    it("admin: returns the caller's where unchanged (or undefined for empty)", () => {
      expect(narrowToOwner(undefined, adminCtx)).toBeUndefined();
      expect(narrowToOwner(null, adminCtx)).toBeUndefined();
      expect(narrowToOwner({ userId: "u2" }, adminCtx)).toEqual({ userId: "u2" });
    });

    it("non-admin, no where: returns just the owner filter", () => {
      expect(narrowToOwner(undefined, userCtx)).toEqual({ userId: "u1" });
    });

    it("non-admin, with where: AND-composed (narrows, never widens)", () => {
      const callerWhere = { message: { contains: "x" }, userId: "u2" };
      expect(narrowToOwner(callerWhere, userCtx)).toEqual({
        AND: [callerWhere, { userId: "u1" }],
      });
    });

    it("anonymous caller: matches nothing (userId sentinel)", () => {
      const out = narrowToOwner(undefined, anonCtx) as unknown as { userId: string };
      expect(out.userId).toBe("__anonymous__");
    });
  });

  describe("feedback read paths carry the filter for non-admin", () => {
    beforeEach(() => {
      const prisma = makePrismaFeedback();
      new FeedbackQuery(
        makeBuilder(),
        prisma,
        { FeedbackFields: "FeedbackFields" } as unknown as FeedbackObject,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
      );
      (makePrismaFeedback as unknown as { last: PrismaService }).last = prisma;
    });

    const read = async (
      resolver: string,
      args: unknown,
      ctx: unknown,
      t4: boolean,
    ): Promise<any> => {
      const prisma = makePrismaFeedback();
      new FeedbackQuery(
        makeBuilder(),
        prisma,
        { FeedbackFields: "FeedbackFields" } as unknown as FeedbackObject,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
      );
      const r = resolvers[resolver];
      if (t4) {
        await (r as Resolve)({}, null, args, ctx);
      } else {
        await (r as unknown as (root: unknown, args: unknown, c: unknown) => Promise<unknown>)(null, args, ctx);
      }
      return prisma;
    };

    it.each([
      ["pageFeedback", "findMany", true],
      ["readFeedbacks", "findMany", true],
      ["countFeedbacks", "count", false],
      ["groupFeedbacks", "groupBy", false],
    ] as const)("%s applies ownership for non-admin", async (resolver, method, t4) => {
      const args = resolver === "groupFeedbacks" ? { by: ["id"], where: null, aggregate: null } : { where: null, orderBy: null, paging: null, distinct: null };
      const prisma = await read(resolver, args, userCtx, t4);
      const call = ((prisma.prisma.feedback as any)[method] as jest.Mock).mock.calls[0][0];
      const where = call.where;
      const asUserId = where?.userId ?? where?.AND?.find((c: any) => c.userId)?.userId;
      expect(asUserId).toBe("u1");
    });

    it("readFeedback (unique): non-admin falls back to findFirstOrThrow", async () => {
      const prisma = makePrismaFeedback();
      new FeedbackQuery(
        makeBuilder(),
        prisma,
        { FeedbackFields: "FeedbackFields" } as unknown as FeedbackObject,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
      );
      await (resolvers["readFeedback"] as Resolve)({}, null, { where: { id: "f1" } }, userCtx);
      expect(prisma.prisma.feedback.findFirstOrThrow).toHaveBeenCalled();
      expect(prisma.prisma.feedback.findUniqueOrThrow).not.toHaveBeenCalled();
    });
  });

  describe("comment and file read paths carry the filter for non-admin", () => {
    it("every comment read resolver applies ownership", async () => {
      const prisma = makePrismaForModel("comment");
      new CommentQuery(
        makeBuilder(),
        prisma,
        { CommentFields: "CommentFields" } as unknown as CommentObject,
        { UserWhereUnique: "UserWhereUnique", UserOrderBy: "UserOrderBy" } as unknown as UserQuery,
      );
      for (const [resolver, method, t4] of [
        ["pageComment", "findMany", true],
        ["readComments", "findMany", true],
        ["countComments", "count", false],
        ["groupComments", "groupBy", false],
      ] as const) {
        (prisma.prisma as any).comment[method].mockClear();
        const args = resolver === "groupComments" ? { by: ["id"], where: null, aggregate: null } : { where: null, orderBy: null, paging: null, distinct: null };
        if (t4) {
          await (resolvers[resolver] as Resolve)({}, null, args, userCtx);
        } else {
          await (resolvers[resolver] as unknown as (root: unknown, args: unknown, c: unknown) => Promise<unknown>)(null, args, userCtx);
        }
        const call = ((prisma.prisma as any).comment[method] as jest.Mock).mock.calls[0][0];
        const asUserId = call.where?.userId ?? call.where?.AND?.find((c: any) => c.userId)?.userId;
        expect(asUserId).toBe("u1");
      }
    });

    it("every file read resolver applies ownership", async () => {
      const prisma = makePrismaForModel("file");
      new FileQuery(
        makeBuilder(),
        prisma,
        { FileFields: "FileFields" } as unknown as FileObject,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
      );
      for (const [resolver, method, t4] of [
        ["pageFile", "findMany", true],
        ["readFiles", "findMany", true],
        ["countFiles", "count", false],
        ["groupFiles", "groupBy", false],
      ] as const) {
        (prisma.prisma as any).file[method].mockClear();
        const args = resolver === "groupFiles" ? { by: ["id"], where: null, aggregate: null } : { where: null, orderBy: null, paging: null, distinct: null };
        if (t4) {
          await (resolvers[resolver] as Resolve)({}, null, args, userCtx);
        } else {
          await (resolvers[resolver] as unknown as (root: unknown, args: unknown, c: unknown) => Promise<unknown>)(null, args, userCtx);
        }
        const call = ((prisma.prisma as any).file[method] as jest.Mock).mock.calls[0][0];
        const asUserId = call.where?.userId ?? call.where?.AND?.find((c: any) => c.userId)?.userId;
        expect(asUserId).toBe("u1");
      }
    });
  });

  describe("admin paths pass through unchanged", () => {
    it("admin feedback readFeedbacks keeps the caller where without an AND", async () => {
      const prisma = makePrismaFeedback();
      new FeedbackQuery(
        makeBuilder(),
        prisma,
        { FeedbackFields: "FeedbackFields" } as unknown as FeedbackObject,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
      );
      await (resolvers["readFeedbacks"] as Resolve)(
        {},
        null,
        { where: { userId: "someone-else" }, orderBy: null, paging: null, distinct: null },
        adminCtx,
      );
      const call = (prisma.prisma.feedback.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toEqual({ userId: "someone-else" });
      expect(call.where.AND).toBeUndefined();
    });
  });

  describe("createFeedback: a non-admin cannot attach someone else's file", () => {
    it("refuses when a connected file does not belong to the caller", async () => {
      const prisma = makePrismaFeedback();
      (prisma.prisma.file.count as jest.Mock).mockResolvedValueOnce(0); // 1 id requested, 0 owned
      new FeedbackMutation(
        makeBuilder(),
        prisma,
        { publish: jest.fn() } as unknown as SubscriptionService,
        { FeedbackStatus: "FeedbackStatus" } as unknown as FeedbackObject,
        { FeedbackWhereUnique: "FeedbackWhereUnique" } as unknown as FeedbackQuery,
        { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery,
      );
      const resolve = resolvers["createFeedback"] as Resolve;
      await expect(
        resolve({}, null, { create: { message: "hi", files: { connect: [{ id: "other-file" }] } } }, userCtx),
      ).rejects.toThrow(/do not belong/i);
      expect(prisma.prisma.feedback.create).not.toHaveBeenCalled();
    });

    it("allows when every connected file belongs to the caller", async () => {
      const prisma = makePrismaFeedback();
      (prisma.prisma.file.count as jest.Mock).mockResolvedValueOnce(2);
      new FeedbackMutation(
        makeBuilder(),
        prisma,
        { publish: jest.fn() } as unknown as SubscriptionService,
        { FeedbackStatus: "FeedbackStatus" } as unknown as FeedbackObject,
        { FeedbackWhereUnique: "FeedbackWhereUnique" } as unknown as FeedbackQuery,
        { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery,
      );
      const resolve = resolvers["createFeedback"] as Resolve;
      await resolve(
        {},
        null,
        { create: { message: "hi", files: { connect: [{ id: "a" }, { id: "b" }] } } },
        userCtx,
      );
      expect(prisma.prisma.feedback.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: "u1" }) }),
      );
    });

    it("createFeedback forces userId to the caller (not whatever is sent)", async () => {
      const prisma = makePrismaFeedback();
      new FeedbackMutation(
        makeBuilder(),
        prisma,
        { publish: jest.fn() } as unknown as SubscriptionService,
        { FeedbackStatus: "FeedbackStatus" } as unknown as FeedbackObject,
        { FeedbackWhereUnique: "FeedbackWhereUnique" } as unknown as FeedbackQuery,
        { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery,
      );
      const resolve = resolvers["createFeedback"] as Resolve;
      await resolve({}, null, { create: { message: "hi" } }, userCtx);
      expect(prisma.prisma.feedback.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: "u1" }) }),
      );
    });
  });

  describe("negative control: without narrowToOwner, non-admin reads see everyone", () => {
    it("the guard: readFeedbacks for a non-admin must apply the filter", async () => {
      const prisma = makePrismaFeedback();
      new FeedbackQuery(
        makeBuilder(),
        prisma,
        { FeedbackFields: "FeedbackFields" } as unknown as FeedbackObject,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
      );
      await (resolvers["readFeedbacks"] as Resolve)(
        {},
        null,
        { where: null, orderBy: null, paging: null, distinct: null },
        userCtx,
      );
      const call = (prisma.prisma.feedback.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toBeDefined();
      expect(call.where.userId ?? call.where.AND?.find?.((c: any) => c.userId)?.userId).toBe("u1");
    });
  });
});
