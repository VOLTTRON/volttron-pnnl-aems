
import { FeedbackMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { FeedbackQuery } from "./query.service";
import { FeedbackObject } from "./object.service";
import { FileQuery } from "../file/query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown, ctx: unknown) => unknown> = {};

function makeMockT() {
  return {
    prismaField: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    prismaCreate: jest.fn(() => "FeedbackCreate"),
    prismaUpdate: jest.fn(() => "FeedbackUpdate"),
    prismaUpdateRelation: jest.fn(() => "FeedbackCreateFiles"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeFeedbackObject(): FeedbackObject {
  return { FeedbackStatus: "FeedbackStatus" } as unknown as FeedbackObject;
}

function makeFeedbackQuery(): FeedbackQuery {
  return { FeedbackWhereUnique: "FeedbackWhereUnique" } as unknown as FeedbackQuery;
}

function makeFileQuery(): FileQuery {
  return { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery;
}

function makePrisma(returnFeedback: object = { id: "f1", message: "test" }) {
  return {
    prisma: {
      feedback: {
        create: jest.fn().mockResolvedValue(returnFeedback),
        update: jest.fn().mockResolvedValue(returnFeedback),
        delete: jest.fn().mockResolvedValue(returnFeedback),
      },
    },
  } as unknown as PrismaService;
}

function makeSubscription() {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionService;
}

const userCtx = { user: { id: "u1", authRoles: { admin: false } } };

describe("FeedbackMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("createFeedback resolver", () => {
    it("calls prisma.feedback.create with userId from context", async () => {
      const prisma = makePrisma({ id: "f1", message: "Good work" });
      const sub = makeSubscription();
      new FeedbackMutation(makeBuilder(), prisma, sub, makeFeedbackObject(), makeFeedbackQuery(), makeFileQuery());

      const resolve = resolvers["createFeedback"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { create: { message: "Good work" } }, userCtx);

      expect(prisma.prisma.feedback.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: "u1", message: "Good work" }) }),
      );
      expect(result).toEqual({ id: "f1", message: "Good work" });
    });

    it("throws when no user is in context", async () => {
      const prisma = makePrisma();
      const sub = makeSubscription();
      new FeedbackMutation(makeBuilder(), prisma, sub, makeFeedbackObject(), makeFeedbackQuery(), makeFileQuery());

      const resolve = resolvers["createFeedback"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await expect(resolve({}, null, { create: { message: "oops" } }, { user: null })).rejects.toThrow("No user logged in");
    });

    it("throws when create arg is missing", async () => {
      const prisma = makePrisma();
      const sub = makeSubscription();
      new FeedbackMutation(makeBuilder(), prisma, sub, makeFeedbackObject(), makeFeedbackQuery(), makeFileQuery());

      const resolve = resolvers["createFeedback"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await expect(resolve({}, null, { create: null }, userCtx)).rejects.toThrow("Feedback message required");
    });

    it("publishes a Feedback subscription event after create", async () => {
      const feedback = { id: "f2", message: "Nice" };
      const prisma = makePrisma(feedback);
      const sub = makeSubscription();
      new FeedbackMutation(makeBuilder(), prisma, sub, makeFeedbackObject(), makeFeedbackQuery(), makeFileQuery());

      const resolve = resolvers["createFeedback"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { message: "Nice" } }, userCtx);

      expect(sub.publish).toHaveBeenCalledTimes(1);
      expect(sub.publish).toHaveBeenCalledWith("Feedback", expect.objectContaining({ id: "f2" }));
    });
  });

  describe("updateFeedback resolver", () => {
    it("calls prisma.feedback.update with where and data", async () => {
      const prisma = makePrisma({ id: "f1", message: "test", status: "closed" });
      const sub = makeSubscription();
      new FeedbackMutation(makeBuilder(), prisma, sub, makeFeedbackObject(), makeFeedbackQuery(), makeFileQuery());

      const resolve = resolvers["updateFeedback"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1" }, update: { status: "closed" } });

      expect(prisma.prisma.feedback.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "f1" }, data: { status: "closed" } }),
      );
    });

    it("publishes two subscription events after update", async () => {
      const feedback = { id: "f1", message: "test" };
      const prisma = makePrisma(feedback);
      const sub = makeSubscription();
      new FeedbackMutation(makeBuilder(), prisma, sub, makeFeedbackObject(), makeFeedbackQuery(), makeFileQuery());

      const resolve = resolvers["updateFeedback"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1" }, update: { status: "closed" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Feedback", expect.objectContaining({ id: "f1" }));
      expect(sub.publish).toHaveBeenCalledWith("Feedback/f1", expect.objectContaining({ id: "f1" }));
    });
  });

  describe("deleteFeedback resolver", () => {
    it("calls prisma.feedback.delete with where arg", async () => {
      const prisma = makePrisma({ id: "f1", message: "test" });
      const sub = makeSubscription();
      new FeedbackMutation(makeBuilder(), prisma, sub, makeFeedbackObject(), makeFeedbackQuery(), makeFileQuery());

      const resolve = resolvers["deleteFeedback"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1" } });

      expect(prisma.prisma.feedback.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "f1" } }),
      );
    });

    it("publishes two subscription events after delete", async () => {
      const feedback = { id: "f1", message: "test" };
      const prisma = makePrisma(feedback);
      const sub = makeSubscription();
      new FeedbackMutation(makeBuilder(), prisma, sub, makeFeedbackObject(), makeFeedbackQuery(), makeFileQuery());

      const resolve = resolvers["deleteFeedback"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Feedback", expect.objectContaining({ id: "f1" }));
      expect(sub.publish).toHaveBeenCalledWith("Feedback/f1", expect.objectContaining({ id: "f1" }));
    });
  });
});
