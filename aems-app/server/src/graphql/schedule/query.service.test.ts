import { ScheduleQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { ScheduleObject } from "./object.service";
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

function makeScheduleObject(): ScheduleObject {
  return { ScheduleFields: "ScheduleFields" } as unknown as ScheduleObject;
}

function makePrisma(data: unknown = []) {
  return {
    prisma: {
      schedule: {
        findMany: jest.fn().mockResolvedValue(data),
        findUniqueOrThrow: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("ScheduleQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected query fields", () => {
    new ScheduleQuery(makeBuilder(), makePrisma(), makeScheduleObject());
    expect(Object.keys(resolvers).sort()).toEqual(
      ["countSchedules", "groupSchedules", "pageSchedule", "readSchedule", "readSchedules"].sort(),
    );
  });

  it("readSchedules calls prisma.schedule.findMany", async () => {
    const data = [{ id: "s1", label: "Weekday" }];
    const prisma = makePrisma(data);
    new ScheduleQuery(makeBuilder(), prisma, makeScheduleObject());
    const result = await resolvers["readSchedules"]({}, null, { where: null, orderBy: null, paging: null, distinct: null });
    expect(result).toEqual(data);
  });

  it("readSchedule calls findUniqueOrThrow", async () => {
    const data = { id: "s1" };
    const prisma = makePrisma();
    (prisma.prisma.schedule.findUniqueOrThrow as jest.Mock).mockResolvedValue(data);
    new ScheduleQuery(makeBuilder(), prisma, makeScheduleObject());
    const result = await resolvers["readSchedule"]({}, null, { where: { id: "s1" } });
    expect(result).toEqual(data);
  });

  it("countSchedules returns the prisma count value", async () => {
    const prisma = makePrisma();
    (prisma.prisma.schedule.count as jest.Mock).mockResolvedValue(6);
    new ScheduleQuery(makeBuilder(), prisma, makeScheduleObject());
    const result = await resolvers["countSchedules"](null, { where: null });
    expect(result).toBe(6);
  });

  it("groupSchedules calls prisma.schedule.groupBy", async () => {
    const prisma = makePrisma();
    new ScheduleQuery(makeBuilder(), prisma, makeScheduleObject());
    await resolvers["groupSchedules"](null, { by: ["label"], where: null, aggregate: null });
    expect(prisma.prisma.schedule.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["label"] }));
  });

  it("pageSchedule calls findMany with where filter", async () => {
    const prisma = makePrisma();
    new ScheduleQuery(makeBuilder(), prisma, makeScheduleObject());
    await resolvers["pageSchedule"]({}, null, { where: { occupied: { equals: true } } });
    expect(prisma.prisma.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { occupied: { equals: true } } }),
    );
  });
});
