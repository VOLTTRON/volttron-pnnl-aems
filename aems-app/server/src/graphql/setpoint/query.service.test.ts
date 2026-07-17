import { SetpointQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { SetpointObject } from "./object.service";
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

function makeSetpointObject(): SetpointObject {
  return { SetpointFields: "SetpointFields" } as unknown as SetpointObject;
}

function makePrisma(data: unknown = []) {
  return {
    prisma: {
      setpoint: {
        findMany: jest.fn().mockResolvedValue(data),
        findUniqueOrThrow: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("SetpointQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected query fields", () => {
    new SetpointQuery(makeBuilder(), makePrisma(), makeSetpointObject());
    expect(Object.keys(resolvers).sort()).toEqual(
      ["countSetpoints", "groupSetpoints", "pageSetpoint", "readSetpoint", "readSetpoints"].sort(),
    );
  });

  it("readSetpoints calls prisma.setpoint.findMany", async () => {
    const data = [{ id: "sp1", setpoint: 72.0 }];
    const prisma = makePrisma(data);
    new SetpointQuery(makeBuilder(), prisma, makeSetpointObject());
    const result = await resolvers["readSetpoints"]({}, null, { where: null, orderBy: null, paging: null, distinct: null });
    expect(result).toEqual(data);
  });

  it("readSetpoint calls findUniqueOrThrow", async () => {
    const data = { id: "sp1" };
    const prisma = makePrisma();
    (prisma.prisma.setpoint.findUniqueOrThrow as jest.Mock).mockResolvedValue(data);
    new SetpointQuery(makeBuilder(), prisma, makeSetpointObject());
    const result = await resolvers["readSetpoint"]({}, null, { where: { id: "sp1" } });
    expect(result).toEqual(data);
  });

  it("countSetpoints returns the prisma count value", async () => {
    const prisma = makePrisma();
    (prisma.prisma.setpoint.count as jest.Mock).mockResolvedValue(9);
    new SetpointQuery(makeBuilder(), prisma, makeSetpointObject());
    const result = await resolvers["countSetpoints"](null, { where: null });
    expect(result).toBe(9);
  });

  it("groupSetpoints calls prisma.setpoint.groupBy", async () => {
    const prisma = makePrisma();
    new SetpointQuery(makeBuilder(), prisma, makeSetpointObject());
    await resolvers["groupSetpoints"](null, { by: ["label"], where: null, aggregate: null });
    expect(prisma.prisma.setpoint.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["label"] }));
  });

  it("pageSetpoint calls findMany with where filter", async () => {
    const prisma = makePrisma();
    new SetpointQuery(makeBuilder(), prisma, makeSetpointObject());
    await resolvers["pageSetpoint"]({}, null, { where: { setpoint: { gt: 70 } } });
    expect(prisma.prisma.setpoint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { setpoint: { gt: 70 } } }),
    );
  });
});
