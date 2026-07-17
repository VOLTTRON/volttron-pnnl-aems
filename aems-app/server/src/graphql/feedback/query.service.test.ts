
import { FeedbackQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { FeedbackObject } from "./object.service";
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

function makeFeedbackObject(): FeedbackObject {
  return { FeedbackFields: "FeedbackFields", FeedbackStatus: "FeedbackStatus" } as unknown as FeedbackObject;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery;
}

function makePrisma(feedbackData: unknown = []) {
  return {
    prisma: {
      feedback: {
        findMany: jest.fn().mockResolvedValue(feedbackData),
        findUniqueOrThrow: jest.fn().mockResolvedValue(feedbackData),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

const adminCtx = { user: { id: "u1", authRoles: { admin: true } } };
const userCtx = { user: { id: "u1", authRoles: { admin: false } } };

describe("FeedbackQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("readFeedbacks resolver", () => {
    it("calls prisma.feedback.findMany and returns results", async () => {
      const feedbacks = [{ id: "f1", message: "Great app" }];
      const prisma = makePrisma(feedbacks);
      new FeedbackQuery(makeBuilder(), prisma, makeFeedbackObject(), makeUserQuery());

      const resolve = resolvers["readFeedbacks"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.feedback.findMany).toHaveBeenCalled();
      expect(result).toEqual(feedbacks);
    });

    it("non-admin: strips where.user and injects where.userId", async () => {
      const prisma = makePrisma([]);
      new FeedbackQuery(makeBuilder(), prisma, makeFeedbackObject(), makeUserQuery());

      const resolve = resolvers["readFeedbacks"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { user: { id: "u1" } }, orderBy: null, paging: null, distinct: null }, userCtx);

      expect(prisma.prisma.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ user: expect.anything() }) }),
      );
      expect(prisma.prisma.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "u1" }) }),
      );
    });

    it("admin: passes where unchanged", async () => {
      const prisma = makePrisma([]);
      new FeedbackQuery(makeBuilder(), prisma, makeFeedbackObject(), makeUserQuery());

      const resolve = resolvers["readFeedbacks"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { message: { contains: "bug" } }, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { message: { contains: "bug" } } }),
      );
    });
  });

  describe("countFeedbacks resolver", () => {
    it("calls prisma.feedback.count and returns count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.feedback.count as jest.Mock).mockResolvedValue(3);
      new FeedbackQuery(makeBuilder(), prisma, makeFeedbackObject(), makeUserQuery());

      const resolve = resolvers["countFeedbacks"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: null }, adminCtx);

      expect(prisma.prisma.feedback.count).toHaveBeenCalled();
      expect(result).toBe(3);
    });

    it("returns 0 when no feedbacks match", async () => {
      const prisma = makePrisma();
      (prisma.prisma.feedback.count as jest.Mock).mockResolvedValue(0);
      new FeedbackQuery(makeBuilder(), prisma, makeFeedbackObject(), makeUserQuery());

      const resolve = resolvers["countFeedbacks"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: { message: { equals: "nothing" } } }, adminCtx);

      expect(result).toBe(0);
    });
  });

  describe("readFeedback resolver", () => {
    it("calls prisma.feedback.findUniqueOrThrow with where arg", async () => {
      const feedback = { id: "f1", message: "Great app" };
      const prisma = makePrisma();
      (prisma.prisma.feedback.findUniqueOrThrow as jest.Mock).mockResolvedValue(feedback);
      new FeedbackQuery(makeBuilder(), prisma, makeFeedbackObject(), makeUserQuery());

      const resolve = resolvers["readFeedback"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: { id: "f1" } }, adminCtx);

      expect(prisma.prisma.feedback.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "f1" } }),
      );
      expect(result).toEqual(feedback);
    });

    it("non-admin: strips where.user from context check", async () => {
      const prisma = makePrisma();
      (prisma.prisma.feedback.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: "f1" });
      new FeedbackQuery(makeBuilder(), prisma, makeFeedbackObject(), makeUserQuery());

      const resolve = resolvers["readFeedback"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1", user: { id: "u1" } } }, userCtx);

      expect(prisma.prisma.feedback.findUniqueOrThrow).toHaveBeenCalled();
    });
  });

  describe("pageFeedback resolver", () => {
    it("calls prisma.feedback.findMany and returns results", async () => {
      const feedbacks = [{ id: "f1" }];
      const prisma = makePrisma(feedbacks);
      new FeedbackQuery(makeBuilder(), prisma, makeFeedbackObject(), makeUserQuery());

      const resolve = resolvers["pageFeedback"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null }, adminCtx);

      expect(prisma.prisma.feedback.findMany).toHaveBeenCalled();
      expect(result).toEqual(feedbacks);
    });
  });

  describe("groupFeedbacks resolver", () => {
    it("calls prisma.feedback.groupBy with by arg", async () => {
      const prisma = makePrisma();
      (prisma.prisma.feedback.groupBy as jest.Mock).mockResolvedValue([{ status: "open", _count: 2 }]);
      new FeedbackQuery(makeBuilder(), prisma, makeFeedbackObject(), makeUserQuery());

      const resolve = resolvers["groupFeedbacks"] as (r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve(null, { by: ["status"], where: null, aggregate: null }, adminCtx);

      expect(prisma.prisma.feedback.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ["status"] }),
      );
    });
  });
});
