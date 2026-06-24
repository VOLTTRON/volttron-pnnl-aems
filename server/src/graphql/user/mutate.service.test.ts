
import { UserMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { UserQuery } from "./query.service";
import { UserObject } from "./object.service";
import { AccountQuery } from "../account/query.service";
import { AccountMutation } from "../account/mutate.service";
import { CommentQuery } from "../comment/query.service";
import { CommentMutation } from "../comment/mutate.service";
import { BannerQuery } from "../banner/query.service";
import { BannerMutation } from "../banner/mutate.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown) => unknown> = {};

function makeMockT() {
  return {
    prismaField: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    DateTime: "DateTime",
    prismaCreate: jest.fn(() => "UserCreate"),
    prismaCreateRelation: jest.fn(() => "UserCreateRelation"),
    prismaUpdate: jest.fn(() => "UserUpdate"),
    prismaUpdateRelation: jest.fn(() => "UserUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeUserObject(): UserObject {
  return { UserPreferences: "UserPreferences" } as unknown as UserObject;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery;
}

function makeAccountQuery(): AccountQuery {
  return { AccountWhereUnique: "AccountWhereUnique" } as unknown as AccountQuery;
}

function makeAccountMutation(): AccountMutation {
  return { AccountCreate: "AccountCreate" } as unknown as AccountMutation;
}

function makeCommentQuery(): CommentQuery {
  return { CommentWhereUnique: "CommentWhereUnique" } as unknown as CommentQuery;
}

function makeCommentMutation(): CommentMutation {
  return { CommentCreate: "CommentCreate" } as unknown as CommentMutation;
}

function makeBannerQuery(): BannerQuery {
  return { BannerWhereUnique: "BannerWhereUnique" } as unknown as BannerQuery;
}

function makeBannerMutation(): BannerMutation {
  return { BannerCreate: "BannerCreate" } as unknown as BannerMutation;
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

function makeAllDeps(prisma: PrismaService, sub: SubscriptionService) {
  return new UserMutation(
    makeBuilder(),
    prisma,
    sub,
    makeUserObject(),
    makeUserQuery(),
    makeAccountQuery(),
    makeCommentQuery(),
    makeBannerQuery(),
    makeAccountMutation(),
    makeCommentMutation(),
    makeBannerMutation(),
  );
}

describe("UserMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("createUser resolver", () => {
    it("calls prisma.user.create with args.create data", async () => {
      const prisma = makePrisma({ id: "u1", email: "a@b.com" });
      const sub = makeSubscription();
      makeAllDeps(prisma, sub);

      const resolve = resolvers["createUser"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { create: { name: "Alice", email: "a@b.com" } });

      expect(prisma.prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: "Alice", email: "a@b.com" } }),
      );
      expect(result).toEqual({ id: "u1", email: "a@b.com" });
    });

    it("publishes a User subscription event after create", async () => {
      const user = { id: "u1", email: "a@b.com" };
      const prisma = makePrisma(user);
      const sub = makeSubscription();
      makeAllDeps(prisma, sub);

      const resolve = resolvers["createUser"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { email: "a@b.com" } });

      expect(sub.publish).toHaveBeenCalledTimes(1);
      expect(sub.publish).toHaveBeenCalledWith("User", expect.objectContaining({ id: "u1" }));
    });
  });

  describe("updateUser resolver", () => {
    it("calls prisma.user.update with where and data", async () => {
      const prisma = makePrisma({ id: "u1", email: "updated@b.com" });
      const sub = makeSubscription();
      makeAllDeps(prisma, sub);

      const resolve = resolvers["updateUser"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "u1" }, update: { email: "updated@b.com" } });

      expect(prisma.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" }, data: { email: "updated@b.com" } }),
      );
    });

    it("publishes two subscription events after update", async () => {
      const user = { id: "u1", email: "updated@b.com" };
      const prisma = makePrisma(user);
      const sub = makeSubscription();
      makeAllDeps(prisma, sub);

      const resolve = resolvers["updateUser"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "u1" }, update: { email: "updated@b.com" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("User", expect.objectContaining({ id: "u1" }));
      expect(sub.publish).toHaveBeenCalledWith("User/u1", expect.objectContaining({ id: "u1" }));
    });
  });

  describe("deleteUser resolver", () => {
    it("calls prisma.user.delete with where arg", async () => {
      const prisma = makePrisma({ id: "u1", email: "a@b.com" });
      const sub = makeSubscription();
      makeAllDeps(prisma, sub);

      const resolve = resolvers["deleteUser"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "u1" } });

      expect(prisma.prisma.user.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" } }),
      );
    });

    it("publishes two subscription events after delete", async () => {
      const user = { id: "u1", email: "a@b.com" };
      const prisma = makePrisma(user);
      const sub = makeSubscription();
      makeAllDeps(prisma, sub);

      const resolve = resolvers["deleteUser"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "u1" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("User", expect.objectContaining({ id: "u1" }));
      expect(sub.publish).toHaveBeenCalledWith("User/u1", expect.objectContaining({ id: "u1" }));
    });
  });
});
