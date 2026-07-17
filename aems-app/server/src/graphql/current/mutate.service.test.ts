
import { CurrentMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { UserObject } from "../user/object.service";
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
    prismaCreate: jest.fn(() => "CurrentCreate"),
    prismaUpdate: jest.fn(() => "CurrentUpdate"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeUserObject(): UserObject {
  return { UserPreferences: "UserPreferences" } as unknown as UserObject;
}

function makePrisma(returnUser: object = { id: "u1", email: "a@b.com" }) {
  return {
    prisma: {
      user: {
        create: jest.fn().mockResolvedValue(returnUser),
        update: jest.fn().mockResolvedValue(returnUser),
        delete: jest.fn().mockResolvedValue(returnUser),
      },
    },
  } as unknown as PrismaService;
}

function makeSubscription() {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionService;
}

const userCtx = { user: { id: "u1", authRoles: { user: true } } };
const anonCtx = { user: null };

describe("CurrentMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("createCurrent resolver", () => {
    it("throws if the user is already logged in", async () => {
      const prisma = makePrisma();
      const sub = makeSubscription();
      new CurrentMutation(makeBuilder(), prisma, sub, makeUserObject());

      const resolve = resolvers["createCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await expect(resolve({}, null, { create: { email: "a@b.com" } }, userCtx)).rejects.toThrow(
        "User is currently logged in.",
      );
      expect(prisma.prisma.user.create).not.toHaveBeenCalled();
    });

    it("creates a new user when not authenticated", async () => {
      const user = { id: "u2", email: "new@b.com" };
      const prisma = makePrisma(user);
      const sub = makeSubscription();
      new CurrentMutation(makeBuilder(), prisma, sub, makeUserObject());

      const resolve = resolvers["createCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { create: { email: "new@b.com" } }, anonCtx);

      expect(prisma.prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { email: "new@b.com" } }),
      );
      expect(result).toEqual(user);
    });

    it("publishes a User subscription event after create", async () => {
      const user = { id: "u2", email: "new@b.com" };
      const prisma = makePrisma(user);
      const sub = makeSubscription();
      new CurrentMutation(makeBuilder(), prisma, sub, makeUserObject());

      const resolve = resolvers["createCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { email: "new@b.com" } }, anonCtx);

      expect(sub.publish).toHaveBeenCalledTimes(1);
      expect(sub.publish).toHaveBeenCalledWith("User", expect.objectContaining({ id: "u2" }));
    });
  });

  describe("updateCurrent resolver", () => {
    it("throws if user is not authenticated", async () => {
      const prisma = makePrisma();
      const sub = makeSubscription();
      new CurrentMutation(makeBuilder(), prisma, sub, makeUserObject());

      const resolve = resolvers["updateCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await expect(resolve({}, null, { update: { name: "Alice" } }, anonCtx)).rejects.toThrow(
        "User must be logged in.",
      );
      expect(prisma.prisma.user.update).not.toHaveBeenCalled();
    });

    it("updates the current user using ctx.user.id as the where clause", async () => {
      const user = { id: "u1", name: "Alice" };
      const prisma = makePrisma(user);
      const sub = makeSubscription();
      new CurrentMutation(makeBuilder(), prisma, sub, makeUserObject());

      const resolve = resolvers["updateCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { update: { name: "Alice" } }, userCtx);

      expect(prisma.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" }, data: { name: "Alice" } }),
      );
    });

    it("publishes two subscription events after update", async () => {
      const user = { id: "u1", name: "Alice" };
      const prisma = makePrisma(user);
      const sub = makeSubscription();
      new CurrentMutation(makeBuilder(), prisma, sub, makeUserObject());

      const resolve = resolvers["updateCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, { update: { name: "Alice" } }, userCtx);

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("User", expect.objectContaining({ id: "u1" }));
      expect(sub.publish).toHaveBeenCalledWith("User/u1", expect.objectContaining({ id: "u1" }));
    });
  });

  describe("deleteCurrent resolver", () => {
    it("throws if user is not authenticated", async () => {
      const prisma = makePrisma();
      const sub = makeSubscription();
      new CurrentMutation(makeBuilder(), prisma, sub, makeUserObject());

      const resolve = resolvers["deleteCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await expect(resolve({}, null, {}, anonCtx)).rejects.toThrow("User must be logged in.");
      expect(prisma.prisma.user.delete).not.toHaveBeenCalled();
    });

    it("deletes the current user using ctx.user.id", async () => {
      const user = { id: "u1", email: "a@b.com" };
      const prisma = makePrisma(user);
      const sub = makeSubscription();
      new CurrentMutation(makeBuilder(), prisma, sub, makeUserObject());

      const resolve = resolvers["deleteCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, {}, userCtx);

      expect(prisma.prisma.user.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" } }),
      );
    });

    it("publishes two subscription events after delete", async () => {
      const user = { id: "u1", email: "a@b.com" };
      const prisma = makePrisma(user);
      const sub = makeSubscription();
      new CurrentMutation(makeBuilder(), prisma, sub, makeUserObject());

      const resolve = resolvers["deleteCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, {}, userCtx);

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("User", expect.objectContaining({ id: "u1" }));
      expect(sub.publish).toHaveBeenCalledWith("User/u1", expect.objectContaining({ id: "u1" }));
    });
  });
});
