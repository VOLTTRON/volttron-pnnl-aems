
import { BannerQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { BannerObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown) => unknown> = {};

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

function makePrisma(bannerData: unknown = []) {
  return {
    prisma: {
      banner: {
        findMany: jest.fn().mockResolvedValue(bannerData),
        findUniqueOrThrow: jest.fn().mockResolvedValue(bannerData),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("BannerQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("readBanners resolver", () => {
    it("calls prisma.banner.findMany and returns results", async () => {
      const banners = [{ id: "b1", message: "Hello" }];
      const prisma = makePrisma(banners);
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["readBanners"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null });

      expect(prisma.prisma.banner.findMany).toHaveBeenCalled();
      expect(result).toEqual(banners);
    });

    it("passes where filter to findMany", async () => {
      const prisma = makePrisma([]);
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["readBanners"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { message: { contains: "hi" } }, orderBy: null, paging: null, distinct: null });

      expect(prisma.prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { message: { contains: "hi" } } }),
      );
    });
  });

  describe("countBanners resolver", () => {
    it("calls prisma.banner.count and returns count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.banner.count as jest.Mock).mockResolvedValue(7);
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["countBanners"] as (r: unknown, args: unknown) => Promise<number>;
      const result = await resolve(null, { where: null });

      expect(prisma.prisma.banner.count).toHaveBeenCalled();
      expect(result).toBe(7);
    });

    it("returns 0 when no banners match", async () => {
      const prisma = makePrisma();
      (prisma.prisma.banner.count as jest.Mock).mockResolvedValue(0);
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["countBanners"] as (r: unknown, args: unknown) => Promise<number>;
      const result = await resolve(null, { where: { message: { equals: "nonexistent" } } });

      expect(result).toBe(0);
    });
  });

  describe("readBanner resolver", () => {
    it("calls prisma.banner.findUniqueOrThrow with where arg", async () => {
      const banner = { id: "b1", message: "Hello" };
      const prisma = makePrisma();
      (prisma.prisma.banner.findUniqueOrThrow as jest.Mock).mockResolvedValue(banner);
      new BannerQuery(makeBuilder(), prisma, makeBannerObject());

      const resolve = resolvers["readBanner"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: { id: "b1" } });

      expect(prisma.prisma.banner.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "b1" } }),
      );
      expect(result).toEqual(banner);
    });
  });
});
