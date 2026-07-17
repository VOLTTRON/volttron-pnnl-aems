
import { BannerMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { BannerQuery } from "./query.service";
import { UserQuery } from "../user/query.service";
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
    prismaCreate: jest.fn(() => "BannerCreate"),
    prismaUpdateRelation: jest.fn(() => "BannerUpdateRelation"),
    prismaUpdate: jest.fn(() => "BannerUpdate"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeBannerQuery(): BannerQuery {
  return { BannerWhereUnique: "BannerWhereUnique" } as unknown as BannerQuery;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery;
}

function makePrisma(returnBanner: object = { id: "b1", message: "test" }) {
  return {
    prisma: {
      banner: {
        create: jest.fn().mockResolvedValue(returnBanner),
        update: jest.fn().mockResolvedValue(returnBanner),
        delete: jest.fn().mockResolvedValue(returnBanner),
      },
    },
  } as unknown as PrismaService;
}

function makeSubscription() {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionService;
}

describe("BannerMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("createBanner resolver", () => {
    it("calls prisma.banner.create with args.create data", async () => {
      const prisma = makePrisma({ id: "b1", message: "Hello" });
      const sub = makeSubscription();
      new BannerMutation(makeBuilder(), prisma, sub, makeBannerQuery(), makeUserQuery());

      const resolve = resolvers["createBanner"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { create: { message: "Hello", expiration: null } });

      expect(prisma.prisma.banner.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { message: "Hello", expiration: null } }),
      );
      expect(result).toEqual({ id: "b1", message: "Hello" });
    });

    it("publishes a Banner subscription event after create", async () => {
      const banner = { id: "b2", message: "Hi" };
      const prisma = makePrisma(banner);
      const sub = makeSubscription();
      new BannerMutation(makeBuilder(), prisma, sub, makeBannerQuery(), makeUserQuery());

      const resolve = resolvers["createBanner"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { message: "Hi", expiration: null } });

      expect(sub.publish).toHaveBeenCalledWith("Banner", expect.objectContaining({ id: "b2" }));
    });
  });

  describe("updateBanner resolver", () => {
    it("calls prisma.banner.update with where and data", async () => {
      const prisma = makePrisma({ id: "b1", message: "Updated" });
      const sub = makeSubscription();
      new BannerMutation(makeBuilder(), prisma, sub, makeBannerQuery(), makeUserQuery());

      const resolve = resolvers["updateBanner"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "b1" }, update: { message: "Updated" } });

      expect(prisma.prisma.banner.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "b1" }, data: { message: "Updated" } }),
      );
    });

    it("publishes two subscription events after update (collection + per-id)", async () => {
      const banner = { id: "b1", message: "Updated" };
      const prisma = makePrisma(banner);
      const sub = makeSubscription();
      new BannerMutation(makeBuilder(), prisma, sub, makeBannerQuery(), makeUserQuery());

      const resolve = resolvers["updateBanner"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "b1" }, update: { message: "Updated" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Banner", expect.objectContaining({ id: "b1" }));
      expect(sub.publish).toHaveBeenCalledWith("Banner/b1", expect.objectContaining({ id: "b1" }));
    });
  });

  describe("deleteBanner resolver", () => {
    it("calls prisma.banner.delete with where arg", async () => {
      const prisma = makePrisma({ id: "b1", message: "Bye" });
      const sub = makeSubscription();
      new BannerMutation(makeBuilder(), prisma, sub, makeBannerQuery(), makeUserQuery());

      const resolve = resolvers["deleteBanner"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "b1" } });

      expect(prisma.prisma.banner.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "b1" } }),
      );
    });

    it("publishes two subscription events after delete", async () => {
      const banner = { id: "b1", message: "Bye" };
      const prisma = makePrisma(banner);
      const sub = makeSubscription();
      new BannerMutation(makeBuilder(), prisma, sub, makeBannerQuery(), makeUserQuery());

      const resolve = resolvers["deleteBanner"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "b1" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Banner", expect.objectContaining({ id: "b1" }));
      expect(sub.publish).toHaveBeenCalledWith("Banner/b1", expect.objectContaining({ id: "b1" }));
    });
  });
});
