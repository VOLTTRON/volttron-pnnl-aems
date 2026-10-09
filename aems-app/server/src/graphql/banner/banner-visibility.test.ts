import { BannerQuery, narrowToUnexpired } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { BannerObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";

type Resolve = (query: unknown, root: unknown, args: unknown, ctx: unknown) => Promise<unknown> | unknown;

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

function makeBannerObject(): BannerObject {
  return { BannerFields: "BannerFields" } as unknown as BannerObject;
}

function makePrisma() {
  return {
    prisma: {
      banner: {
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "b1" }),
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: "b1" }),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

const adminCtx = { user: { id: "u1", authRoles: { admin: true, user: true } } };
const userCtx = { user: { id: "u2", authRoles: { admin: false, user: true } } };

// scenario: banner-visibility
describe("Banner visibility: non-admin never reads an expired banner; admin reads every one", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("narrowToUnexpired helper", () => {
    it("admin: returns the caller's where unchanged (or undefined for empty)", () => {
      expect(narrowToUnexpired(undefined, true)).toBeUndefined();
      expect(narrowToUnexpired(null, true)).toBeUndefined();
      expect(narrowToUnexpired({ message: { contains: "x" } }, true)).toEqual({ message: { contains: "x" } });
    });

    it("non-admin, no where: returns just the unexpired filter", () => {
      const now = new Date("2026-01-01T00:00:00Z");
      const out = narrowToUnexpired(undefined, false, now) as any;
      expect(out).toEqual({ OR: [{ expiration: null }, { expiration: { gt: now } }] });
    });

    it("non-admin, with where: composes caller's where under AND (narrows, never widens)", () => {
      const now = new Date("2026-01-01T00:00:00Z");
      const callerWhere = { message: { contains: "x" } };
      const out = narrowToUnexpired(callerWhere, false, now) as any;
      expect(out).toEqual({
        AND: [callerWhere, { OR: [{ expiration: null }, { expiration: { gt: now } }] }],
      });
    });
  });

  describe("readBanners resolver", () => {
    it("non-admin: forces unexpired filter even when caller passes none", async () => {
      const prisma = makePrisma();
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["readBanners"] as Resolve;
      await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, userCtx);

      const call = (prisma.prisma.banner.findMany as jest.Mock).mock.calls[0][0];
      // Non-admin always carries the expiration filter — either as the whole where or inside an AND.
      const where = call.where;
      const asOr = where?.OR ?? where?.AND?.find((c: any) => c.OR)?.OR;
      expect(asOr).toBeDefined();
      expect(asOr).toEqual(expect.arrayContaining([expect.objectContaining({ expiration: null })]));
    });

    it("non-admin: a caller where only narrows (survives under AND)", async () => {
      const prisma = makePrisma();
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["readBanners"] as Resolve;
      await resolve(
        {},
        null,
        { where: { message: { contains: "term" } }, orderBy: null, paging: null, distinct: null },
        userCtx,
      );

      const call = (prisma.prisma.banner.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.AND).toBeDefined();
      expect(call.where.AND).toEqual(
        expect.arrayContaining([expect.objectContaining({ message: { contains: "term" } })]),
      );
    });

    it("admin: passes through caller where without the expiration filter", async () => {
      const prisma = makePrisma();
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["readBanners"] as Resolve;
      await resolve(
        {},
        null,
        { where: { message: { contains: "term" } }, orderBy: null, paging: null, distinct: null },
        adminCtx,
      );

      const call = (prisma.prisma.banner.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toEqual({ message: { contains: "term" } });
    });

    // Negative control: flip the admin flag and the test must flip red
    it("negative control: a would-be admin with authRoles.admin=false still gets the filter", async () => {
      const prisma = makePrisma();
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["readBanners"] as Resolve;
      await resolve(
        {},
        null,
        { where: null, orderBy: null, paging: null, distinct: null },
        { user: { id: "u3", authRoles: { admin: false } } },
      );

      const call = (prisma.prisma.banner.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toBeDefined();
      expect(call.where.OR).toBeDefined();
    });
  });

  describe("readBanner resolver", () => {
    it("admin: findUniqueOrThrow, no expiration constraint", async () => {
      const prisma = makePrisma();
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["readBanner"] as Resolve;
      await resolve({}, null, { where: { id: "b1" } }, adminCtx);

      expect(prisma.prisma.banner.findUniqueOrThrow).toHaveBeenCalled();
      expect(prisma.prisma.banner.findFirstOrThrow).not.toHaveBeenCalled();
    });

    it("non-admin: findFirstOrThrow with id + unexpired", async () => {
      const prisma = makePrisma();
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["readBanner"] as Resolve;
      await resolve({}, null, { where: { id: "b1" } }, userCtx);

      expect(prisma.prisma.banner.findFirstOrThrow).toHaveBeenCalled();
      const call = (prisma.prisma.banner.findFirstOrThrow as jest.Mock).mock.calls[0][0];
      expect(call.where.AND).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "b1" })]),
      );
      expect(call.where.AND).toEqual(
        expect.arrayContaining([expect.objectContaining({ OR: expect.anything() })]),
      );
    });
  });

  describe("pageBanner, countBanners, groupBanners: all carry the filter for non-admin", () => {
    it("pageBanner applies the unexpired filter for a non-admin", async () => {
      const prisma = makePrisma();
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["pageBanner"] as Resolve;
      await resolve({}, null, { where: null }, userCtx);

      const call = (prisma.prisma.banner.findMany as jest.Mock).mock.calls[0][0];
      const where = call.where;
      const asOr = where?.OR ?? where?.AND?.find((c: any) => c.OR)?.OR;
      expect(asOr).toBeDefined();
    });

    // countBanners and groupBanners use t.field (no query arg): resolve(root, args, ctx)
    type FieldResolve = (root: unknown, args: unknown, ctx: unknown) => Promise<unknown>;

    it("countBanners applies the unexpired filter for a non-admin", async () => {
      const prisma = makePrisma();
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["countBanners"] as unknown as FieldResolve;
      await resolve(null, { where: null }, userCtx);

      const call = (prisma.prisma.banner.count as jest.Mock).mock.calls[0][0];
      const where = call.where;
      const asOr = where?.OR ?? where?.AND?.find((c: any) => c.OR)?.OR;
      expect(asOr).toBeDefined();
    });

    it("groupBanners applies the unexpired filter for a non-admin", async () => {
      const prisma = makePrisma();
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["groupBanners"] as unknown as FieldResolve;
      await resolve(null, { by: ["id"], where: null, aggregate: null }, userCtx);

      const call = (prisma.prisma.banner.groupBy as jest.Mock).mock.calls[0][0];
      const where = call.where;
      const asOr = where?.OR ?? where?.AND?.find((c: any) => c.OR)?.OR;
      expect(asOr).toBeDefined();
    });
  });
});
