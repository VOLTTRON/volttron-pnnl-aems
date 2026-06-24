
import { GeographyQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { GeographyObject } from "./object.service";
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
    inputType: jest.fn(() => "inputType"),
    addScalarType: jest.fn(),
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeGeographyObject(): GeographyObject {
  return { GeographyFields: "GeographyFields", GeographyGeoJson: "GeographyGeoJson" } as unknown as GeographyObject;
}

function makePrisma(geoData: unknown = []) {
  return {
    prisma: {
      geography: {
        findMany: jest.fn().mockResolvedValue(geoData),
        findUniqueOrThrow: jest.fn().mockResolvedValue(geoData),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    },
  } as unknown as PrismaService;
}

const userCtx = { user: { id: "u1", authRoles: { user: true } } };

describe("GeographyQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("areaGeographies resolver", () => {
    it("calls prisma.$queryRaw and returns results", async () => {
      const geos = [{ id: "g1", name: "TestArea" }];
      const prisma = makePrisma();
      (prisma.prisma.$queryRaw as jest.Mock).mockResolvedValue(geos);
      new GeographyQuery(makeBuilder(), prisma, makeGeographyObject());

      const resolve = resolvers["areaGeographies"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({ select: { id: true, name: true } }, null, { area: '{"type":"Polygon"}' }, userCtx);

      expect(prisma.prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(geos);
    });

    it("returns empty array when no geographies intersect", async () => {
      const prisma = makePrisma();
      (prisma.prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      new GeographyQuery(makeBuilder(), prisma, makeGeographyObject());

      const resolve = resolvers["areaGeographies"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { area: '{"type":"Polygon"}' }, userCtx);

      expect(result).toEqual([]);
    });
  });

  describe("readGeographies resolver", () => {
    it("calls prisma.geography.findMany and returns results", async () => {
      const geos = [{ id: "g1", name: "Region A" }];
      const prisma = makePrisma(geos);
      new GeographyQuery(makeBuilder(), prisma, makeGeographyObject());

      const resolve = resolvers["readGeographies"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, userCtx);

      expect(prisma.prisma.geography.findMany).toHaveBeenCalled();
      expect(result).toEqual(geos);
    });
  });

  describe("readGeography resolver", () => {
    it("calls prisma.geography.findUniqueOrThrow with where arg", async () => {
      const geo = { id: "g1", name: "Region A" };
      const prisma = makePrisma();
      (prisma.prisma.geography.findUniqueOrThrow as jest.Mock).mockResolvedValue(geo);
      new GeographyQuery(makeBuilder(), prisma, makeGeographyObject());

      const resolve = resolvers["readGeography"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: { id: "g1" } }, userCtx);

      expect(prisma.prisma.geography.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "g1" } }),
      );
      expect(result).toEqual(geo);
    });
  });

  describe("pageGeography resolver", () => {
    it("calls prisma.geography.findMany and returns results", async () => {
      const geos = [{ id: "g1" }];
      const prisma = makePrisma(geos);
      new GeographyQuery(makeBuilder(), prisma, makeGeographyObject());

      const resolve = resolvers["pageGeography"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null }, userCtx);

      expect(prisma.prisma.geography.findMany).toHaveBeenCalled();
      expect(result).toEqual(geos);
    });
  });

  describe("countGeographies resolver", () => {
    it("returns count from prisma.geography.count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.geography.count as jest.Mock).mockResolvedValue(42);
      new GeographyQuery(makeBuilder(), prisma, makeGeographyObject());

      const resolve = resolvers["countGeographies"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: null }, userCtx);

      expect(prisma.prisma.geography.count).toHaveBeenCalled();
      expect(result).toBe(42);
    });
  });

  describe("groupGeographies resolver", () => {
    it("calls prisma.geography.groupBy with by arg", async () => {
      const prisma = makePrisma();
      (prisma.prisma.geography.groupBy as jest.Mock).mockResolvedValue([{ type: "region", _count: 5 }]);
      new GeographyQuery(makeBuilder(), prisma, makeGeographyObject());

      const resolve = resolvers["groupGeographies"] as (r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve(null, { by: ["type"], where: null, aggregate: null }, userCtx);

      expect(prisma.prisma.geography.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ["type"] }),
      );
    });
  });
});
