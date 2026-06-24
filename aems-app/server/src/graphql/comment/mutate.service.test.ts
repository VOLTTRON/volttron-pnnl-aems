
import { CommentMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { CommentQuery } from "./query.service";
import { UserQuery } from "../user/query.service";
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
    prismaCreate: jest.fn(() => "CommentCreate"),
    prismaCreateRelation: jest.fn(() => "CommentCreateRelation"),
    prismaUpdate: jest.fn(() => "CommentUpdate"),
    prismaUpdateRelation: jest.fn(() => "CommentUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeCommentQuery(): CommentQuery {
  return { CommentWhereUnique: "CommentWhereUnique" } as unknown as CommentQuery;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery;
}

function makePrisma(returnComment: object = { id: "c1", message: "test" }) {
  return {
    prisma: {
      comment: {
        create: jest.fn().mockResolvedValue(returnComment),
        update: jest.fn().mockResolvedValue(returnComment),
        delete: jest.fn().mockResolvedValue(returnComment),
      },
    },
  } as unknown as PrismaService;
}

function makeSubscription() {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionService;
}

const adminCtx = { user: { id: "u1", authRoles: { admin: true } } };
const userCtx = { user: { id: "u1", authRoles: { admin: false } } };

describe("CommentMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("createComment resolver", () => {
    it("calls prisma.comment.create and returns result", async () => {
      const prisma = makePrisma({ id: "c1", message: "Hello" });
      const sub = makeSubscription();
      new CommentMutation(makeBuilder(), prisma, sub, makeCommentQuery(), makeUserQuery());

      const resolve = resolvers["createComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { create: { message: "Hello" } }, adminCtx);

      expect(prisma.prisma.comment.create).toHaveBeenCalled();
      expect(result).toEqual({ id: "c1", message: "Hello" });
    });

    it("non-admin: overrides create.user with context userId", async () => {
      const prisma = makePrisma({ id: "c1", message: "Hi" });
      const sub = makeSubscription();
      new CommentMutation(makeBuilder(), prisma, sub, makeCommentQuery(), makeUserQuery());

      const resolve = resolvers["createComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { message: "Hi", user: { connect: { id: "other" } } } }, userCtx);

      expect(prisma.prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ user: { connect: { id: "u1" } } }),
        }),
      );
    });

    it("publishes a Comment subscription event after create", async () => {
      const comment = { id: "c2", message: "Hi" };
      const prisma = makePrisma(comment);
      const sub = makeSubscription();
      new CommentMutation(makeBuilder(), prisma, sub, makeCommentQuery(), makeUserQuery());

      const resolve = resolvers["createComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { message: "Hi" } }, adminCtx);

      expect(sub.publish).toHaveBeenCalledTimes(1);
      expect(sub.publish).toHaveBeenCalledWith("Comment", expect.objectContaining({ id: "c2" }));
    });
  });

  describe("updateComment resolver", () => {
    it("calls prisma.comment.update with where and data", async () => {
      const prisma = makePrisma({ id: "c1", message: "Updated" });
      const sub = makeSubscription();
      new CommentMutation(makeBuilder(), prisma, sub, makeCommentQuery(), makeUserQuery());

      const resolve = resolvers["updateComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "c1" }, update: { message: "Updated" } }, adminCtx);

      expect(prisma.prisma.comment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "c1" }, data: { message: "Updated" } }),
      );
    });

    it("non-admin: strips where.user and injects where.userId", async () => {
      const prisma = makePrisma({ id: "c1", message: "Updated" });
      const sub = makeSubscription();
      new CommentMutation(makeBuilder(), prisma, sub, makeCommentQuery(), makeUserQuery());

      const resolve = resolvers["updateComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "c1", user: { id: "u1" } }, update: { message: "Updated" } }, userCtx);

      expect(prisma.prisma.comment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ user: expect.anything() }),
        }),
      );
      expect(prisma.prisma.comment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "u1" }),
        }),
      );
    });

    it("publishes two subscription events after update", async () => {
      const comment = { id: "c1", message: "Updated" };
      const prisma = makePrisma(comment);
      const sub = makeSubscription();
      new CommentMutation(makeBuilder(), prisma, sub, makeCommentQuery(), makeUserQuery());

      const resolve = resolvers["updateComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "c1" }, update: { message: "Updated" } }, adminCtx);

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Comment", expect.objectContaining({ id: "c1" }));
      expect(sub.publish).toHaveBeenCalledWith("Comment/c1", expect.objectContaining({ id: "c1" }));
    });
  });

  describe("deleteComment resolver", () => {
    it("calls prisma.comment.delete with where arg", async () => {
      const prisma = makePrisma({ id: "c1", message: "Bye" });
      const sub = makeSubscription();
      new CommentMutation(makeBuilder(), prisma, sub, makeCommentQuery(), makeUserQuery());

      const resolve = resolvers["deleteComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "c1" } }, adminCtx);

      expect(prisma.prisma.comment.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "c1" } }),
      );
    });

    it("non-admin: injects where.userId before delete", async () => {
      const prisma = makePrisma({ id: "c1", message: "Bye" });
      const sub = makeSubscription();
      new CommentMutation(makeBuilder(), prisma, sub, makeCommentQuery(), makeUserQuery());

      const resolve = resolvers["deleteComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "c1" } }, userCtx);

      expect(prisma.prisma.comment.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "u1" }) }),
      );
    });

    it("publishes two subscription events after delete", async () => {
      const comment = { id: "c1", message: "Bye" };
      const prisma = makePrisma(comment);
      const sub = makeSubscription();
      new CommentMutation(makeBuilder(), prisma, sub, makeCommentQuery(), makeUserQuery());

      const resolve = resolvers["deleteComment"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "c1" } }, adminCtx);

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Comment", expect.objectContaining({ id: "c1" }));
      expect(sub.publish).toHaveBeenCalledWith("Comment/c1", expect.objectContaining({ id: "c1" }));
    });
  });
});
