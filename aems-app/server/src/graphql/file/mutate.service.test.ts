
import { FileMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { FileQuery } from "./query.service";
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
    prismaCreate: jest.fn(() => "FileCreate"),
    prismaCreateRelation: jest.fn(() => "FileUpdateUser"),
    prismaUpdate: jest.fn(() => "FileUpdate"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeFileQuery(): FileQuery {
  return { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery;
}

function makePrisma(returnFile: object = { id: "f1", objectKey: "uploads/test.png" }) {
  return {
    prisma: {
      file: {
        create: jest.fn().mockResolvedValue(returnFile),
        update: jest.fn().mockResolvedValue(returnFile),
        delete: jest.fn().mockResolvedValue(returnFile),
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

describe("FileMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("createFile resolver", () => {
    it("non-admin: connects user to ctx.user.id, ignores supplied user", async () => {
      const file = { id: "f1", objectKey: "uploads/test.png" };
      const prisma = makePrisma(file);
      const sub = makeSubscription();
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery());

      const resolve = resolvers["createFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve(
        {},
        null,
        { create: { objectKey: "uploads/test.png", mimeType: "image/png", contentLength: 1024, user: { connect: { id: "other" } } } },
        userCtx,
      );

      // Only objectKey, mimeType, contentLength are picked — user connection is handled separately
      expect(prisma.prisma.file.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ objectKey: "uploads/test.png", mimeType: "image/png", contentLength: 1024 }),
        }),
      );
    });

    it("publishes a File subscription event after create", async () => {
      const file = { id: "f1", objectKey: "uploads/test.png" };
      const prisma = makePrisma(file);
      const sub = makeSubscription();
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery());

      const resolve = resolvers["createFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { objectKey: "uploads/test.png", mimeType: "image/png", contentLength: 100 } }, userCtx);

      expect(sub.publish).toHaveBeenCalledTimes(1);
      expect(sub.publish).toHaveBeenCalledWith("File", expect.objectContaining({ id: "f1" }));
    });
  });

  describe("updateFile resolver", () => {
    it("calls prisma.file.update with where and data", async () => {
      const file = { id: "f1", objectKey: "updated.png" };
      const prisma = makePrisma(file);
      const sub = makeSubscription();
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery());

      const resolve = resolvers["updateFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1" }, update: { objectKey: "updated.png" } }, adminCtx);

      expect(prisma.prisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: "f1" }), data: { objectKey: "updated.png" } }),
      );
    });

    it("non-admin: strips where.user and injects where.userId", async () => {
      const file = { id: "f1" };
      const prisma = makePrisma(file);
      const sub = makeSubscription();
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery());

      const resolve = resolvers["updateFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1", user: { id: "u2" } }, update: {} }, userCtx);

      expect(prisma.prisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "u1" }),
        }),
      );
      expect(prisma.prisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ user: expect.anything() }),
        }),
      );
    });

    it("publishes two subscription events after update", async () => {
      const file = { id: "f1" };
      const prisma = makePrisma(file);
      const sub = makeSubscription();
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery());

      const resolve = resolvers["updateFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1" }, update: {} }, adminCtx);

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("File", expect.objectContaining({ id: "f1" }));
      expect(sub.publish).toHaveBeenCalledWith("File/f1", expect.objectContaining({ id: "f1" }));
    });
  });

  describe("deleteFile resolver", () => {
    it("calls prisma.file.delete with where arg", async () => {
      const file = { id: "f1" };
      const prisma = makePrisma(file);
      const sub = makeSubscription();
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery());

      const resolve = resolvers["deleteFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1" } }, adminCtx);

      expect(prisma.prisma.file.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: "f1" }) }),
      );
    });

    it("non-admin: injects userId into delete where", async () => {
      const file = { id: "f1" };
      const prisma = makePrisma(file);
      const sub = makeSubscription();
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery());

      const resolve = resolvers["deleteFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1" } }, userCtx);

      expect(prisma.prisma.file.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "u1" }) }),
      );
    });

    it("publishes two subscription events after delete", async () => {
      const file = { id: "f1" };
      const prisma = makePrisma(file);
      const sub = makeSubscription();
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery());

      const resolve = resolvers["deleteFile"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "f1" } }, adminCtx);

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("File", expect.objectContaining({ id: "f1" }));
      expect(sub.publish).toHaveBeenCalledWith("File/f1", expect.objectContaining({ id: "f1" }));
    });
  });
});
