import { ControlQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { ControlObject } from "./object.service";
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
    BooleanFilter: "BooleanFilter",
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

function makeControlObject(): ControlObject {
  return { ControlFields: "ControlFields" } as unknown as ControlObject;
}

function makePrisma(data: unknown = []) {
  return {
    prisma: {
      control: {
        findMany: jest.fn().mockResolvedValue(data),
        findUniqueOrThrow: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("ControlQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected query fields", () => {
    new ControlQuery(makeBuilder(), makePrisma(), makeControlObject());
    expect(Object.keys(resolvers).sort()).toEqual(
      ["countControls", "groupControls", "pageControl", "readControl", "readControls"].sort(),
    );
  });

  it("readControls calls prisma.control.findMany", async () => {
    const data = [{ id: "ctrl1", name: "Building-A" }];
    const prisma = makePrisma(data);
    new ControlQuery(makeBuilder(), prisma, makeControlObject());
    const result = await resolvers["readControls"]({}, null, { where: null, orderBy: null, paging: null, distinct: null });
    expect(result).toEqual(data);
  });

  it("readControl calls findUniqueOrThrow", async () => {
    const data = { id: "ctrl1" };
    const prisma = makePrisma();
    (prisma.prisma.control.findUniqueOrThrow as jest.Mock).mockResolvedValue(data);
    new ControlQuery(makeBuilder(), prisma, makeControlObject());
    const result = await resolvers["readControl"]({}, null, { where: { id: "ctrl1" } });
    expect(result).toEqual(data);
  });

  it("countControls returns the prisma count value", async () => {
    const prisma = makePrisma();
    (prisma.prisma.control.count as jest.Mock).mockResolvedValue(2);
    new ControlQuery(makeBuilder(), prisma, makeControlObject());
    const result = await resolvers["countControls"](null, { where: null });
    expect(result).toBe(2);
  });

  it("groupControls calls prisma.control.groupBy", async () => {
    const prisma = makePrisma();
    new ControlQuery(makeBuilder(), prisma, makeControlObject());
    await resolvers["groupControls"](null, { by: ["campus"], where: null, aggregate: null });
    expect(prisma.prisma.control.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["campus"] }));
  });

  it("pageControl calls findMany with where", async () => {
    const prisma = makePrisma();
    new ControlQuery(makeBuilder(), prisma, makeControlObject());
    await resolvers["pageControl"]({}, null, { where: { peakLoadExclude: { equals: true } } });
    expect(prisma.prisma.control.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { peakLoadExclude: { equals: true } } }),
    );
  });
});
