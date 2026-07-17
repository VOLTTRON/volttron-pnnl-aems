import { OccupancyQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { OccupancyObject } from "./object.service";
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
    DateTimeFilter: "DateTimeFilter",
    PagingInput: "PagingInput",
    ModelStage: "ModelStage",
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

function makeOccupancyObject(): OccupancyObject {
  return { OccupancyFields: "OccupancyFields" } as unknown as OccupancyObject;
}

function makePrisma(data: unknown = []) {
  return {
    prisma: {
      occupancy: {
        findMany: jest.fn().mockResolvedValue(data),
        findUniqueOrThrow: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("OccupancyQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected query fields", () => {
    new OccupancyQuery(makeBuilder(), makePrisma(), makeOccupancyObject());
    expect(Object.keys(resolvers).sort()).toEqual(
      ["countOccupancies", "groupOccupancies", "pageOccupancy", "readOccupancies", "readOccupancy"].sort(),
    );
  });

  it("readOccupancies calls prisma.occupancy.findMany", async () => {
    const data = [{ id: "o1", label: "Friday" }];
    const prisma = makePrisma(data);
    new OccupancyQuery(makeBuilder(), prisma, makeOccupancyObject());
    const result = await resolvers["readOccupancies"]({}, null, { where: null, orderBy: null, paging: null, distinct: null });
    expect(result).toEqual(data);
  });

  it("readOccupancy calls findUniqueOrThrow", async () => {
    const data = { id: "o1" };
    const prisma = makePrisma();
    (prisma.prisma.occupancy.findUniqueOrThrow as jest.Mock).mockResolvedValue(data);
    new OccupancyQuery(makeBuilder(), prisma, makeOccupancyObject());
    const result = await resolvers["readOccupancy"]({}, null, { where: { id: "o1" } });
    expect(result).toEqual(data);
  });

  it("countOccupancies returns the prisma count value", async () => {
    const prisma = makePrisma();
    (prisma.prisma.occupancy.count as jest.Mock).mockResolvedValue(4);
    new OccupancyQuery(makeBuilder(), prisma, makeOccupancyObject());
    const result = await resolvers["countOccupancies"](null, { where: null });
    expect(result).toBe(4);
  });

  it("groupOccupancies calls prisma.occupancy.groupBy", async () => {
    const prisma = makePrisma();
    new OccupancyQuery(makeBuilder(), prisma, makeOccupancyObject());
    await resolvers["groupOccupancies"](null, { by: ["label"], where: null, aggregate: null });
    expect(prisma.prisma.occupancy.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["label"] }));
  });

  it("pageOccupancy calls findMany with where filter", async () => {
    const prisma = makePrisma();
    new OccupancyQuery(makeBuilder(), prisma, makeOccupancyObject());
    await resolvers["pageOccupancy"]({}, null, { where: { label: { equals: "x" } } });
    expect(prisma.prisma.occupancy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { label: { equals: "x" } } }),
    );
  });
});
