import { LocationQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { LocationObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";

const resolvers: Record<string, (...args: unknown[]) => unknown> = {};

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
    FloatFilter: "FloatFilter",
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

function makeLocationObject(): LocationObject {
  return { LocationFields: "LocationFields" } as unknown as LocationObject;
}

function makePrisma(data: unknown = []) {
  return {
    prisma: {
      location: {
        findMany: jest.fn().mockResolvedValue(data),
        findUniqueOrThrow: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("LocationQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected query fields", () => {
    new LocationQuery(makeBuilder(), makePrisma(), makeLocationObject());
    expect(Object.keys(resolvers).sort()).toEqual(
      ["countLocations", "groupLocations", "pageLocation", "readLocation", "readLocations"].sort(),
    );
  });

  it("readLocations calls prisma.location.findMany", async () => {
    const data = [{ id: "l1", name: "PNNL" }];
    const prisma = makePrisma(data);
    new LocationQuery(makeBuilder(), prisma, makeLocationObject());
    const result = await resolvers["readLocations"]({}, null, { where: null, orderBy: null, paging: null, distinct: null });
    expect(result).toEqual(data);
  });

  it("readLocation calls findUniqueOrThrow", async () => {
    const data = { id: "l1" };
    const prisma = makePrisma();
    (prisma.prisma.location.findUniqueOrThrow as jest.Mock).mockResolvedValue(data);
    new LocationQuery(makeBuilder(), prisma, makeLocationObject());
    const result = await resolvers["readLocation"]({}, null, { where: { id: "l1" } });
    expect(result).toEqual(data);
  });

  it("countLocations returns the prisma count value", async () => {
    const prisma = makePrisma();
    (prisma.prisma.location.count as jest.Mock).mockResolvedValue(1);
    new LocationQuery(makeBuilder(), prisma, makeLocationObject());
    const result = await resolvers["countLocations"](null, { where: null });
    expect(result).toBe(1);
  });

  it("groupLocations calls prisma.location.groupBy", async () => {
    const prisma = makePrisma();
    new LocationQuery(makeBuilder(), prisma, makeLocationObject());
    await resolvers["groupLocations"](null, { by: ["name"], where: null, aggregate: null });
    expect(prisma.prisma.location.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["name"] }));
  });

  it("pageLocation calls findMany with where filter", async () => {
    const prisma = makePrisma();
    new LocationQuery(makeBuilder(), prisma, makeLocationObject());
    await resolvers["pageLocation"]({}, null, { where: { latitude: { gt: 0 } } });
    expect(prisma.prisma.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { latitude: { gt: 0 } } }),
    );
  });
});
