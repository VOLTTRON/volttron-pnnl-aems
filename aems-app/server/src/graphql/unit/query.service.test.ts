import { UnitQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { UnitObject } from "./object.service";
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
    IntFilter: "IntFilter",
    FloatFilter: "FloatFilter",
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

function makeUnitObject(): UnitObject {
  return { UnitFields: "UnitFields" } as unknown as UnitObject;
}

function makePrisma(data: unknown = []) {
  return {
    prisma: {
      unit: {
        findMany: jest.fn().mockResolvedValue(data),
        findUniqueOrThrow: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

const adminCtx = { user: { id: "admin-1", authRoles: { admin: true } } };
const userCtx = { user: { id: "u1", authRoles: { admin: false } } };

describe("UnitQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected query fields", () => {
    new UnitQuery(makeBuilder(), makePrisma(), makeUnitObject());
    expect(Object.keys(resolvers).sort()).toEqual(
      ["countUnits", "groupUnits", "pageUnit", "readUnit", "readUnits"].sort(),
    );
  });

  it("readUnits passes raw where for admin context", async () => {
    const prisma = makePrisma([]);
    new UnitQuery(makeBuilder(), prisma, makeUnitObject());
    await resolvers["readUnits"](
      {},
      null,
      { where: { name: { equals: "AHU-1" } }, orderBy: null, paging: null, distinct: null },
      adminCtx,
    );
    expect(prisma.prisma.unit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: { equals: "AHU-1" } } }),
    );
  });

  it("readUnits restricts to user's units for non-admin context", async () => {
    const prisma = makePrisma([]);
    new UnitQuery(makeBuilder(), prisma, makeUnitObject());
    await resolvers["readUnits"](
      {},
      null,
      { where: null, orderBy: null, paging: null, distinct: null },
      userCtx,
    );
    expect(prisma.prisma.unit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ users: { some: { id: "u1" } } }) }),
    );
  });

  it("readUnit restricts to user's units for non-admin", async () => {
    const prisma = makePrisma();
    new UnitQuery(makeBuilder(), prisma, makeUnitObject());
    await resolvers["readUnit"]({}, null, { where: { id: "uni-1" } }, userCtx);
    expect(prisma.prisma.unit.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "uni-1", users: { some: { id: "u1" } } }) }),
    );
  });

  it("countUnits returns prisma count for admin", async () => {
    const prisma = makePrisma();
    (prisma.prisma.unit.count as jest.Mock).mockResolvedValue(8);
    new UnitQuery(makeBuilder(), prisma, makeUnitObject());
    const result = await resolvers["countUnits"](null, { where: null }, adminCtx);
    expect(result).toBe(8);
  });

  it("countUnits adds user filter for non-admin", async () => {
    const prisma = makePrisma();
    new UnitQuery(makeBuilder(), prisma, makeUnitObject());
    await resolvers["countUnits"](null, { where: null }, userCtx);
    expect(prisma.prisma.unit.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ users: { some: { id: "u1" } } }) }),
    );
  });

  it("groupUnits adds user filter for non-admin", async () => {
    const prisma = makePrisma();
    new UnitQuery(makeBuilder(), prisma, makeUnitObject());
    await resolvers["groupUnits"](null, { by: ["building"], where: null, aggregate: null }, userCtx);
    expect(prisma.prisma.unit.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ["building"], where: expect.objectContaining({ users: { some: { id: "u1" } } }) }),
    );
  });

  it("pageUnit passes raw where for admin", async () => {
    const prisma = makePrisma();
    new UnitQuery(makeBuilder(), prisma, makeUnitObject());
    await resolvers["pageUnit"]({}, null, { where: { campus: { equals: "PNNL" } } }, adminCtx);
    expect(prisma.prisma.unit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { campus: { equals: "PNNL" } } }),
    );
  });
});
