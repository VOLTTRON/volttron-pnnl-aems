import { HolidayQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { HolidayObject } from "./object.service";
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

function makeHolidayObject(): HolidayObject {
  return { HolidayFields: "HolidayFields", HolidayType: "HolidayType" } as unknown as HolidayObject;
}

function makePrisma(data: unknown = []) {
  return {
    prisma: {
      holiday: {
        findMany: jest.fn().mockResolvedValue(data),
        findUniqueOrThrow: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("HolidayQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected query fields", () => {
    new HolidayQuery(makeBuilder(), makePrisma(), makeHolidayObject());
    expect(Object.keys(resolvers).sort()).toEqual(
      ["countHolidays", "groupHolidays", "pageHoliday", "readHoliday", "readHolidays"].sort(),
    );
  });

  it("readHolidays calls prisma.holiday.findMany", async () => {
    const data = [{ id: "h1", label: "Jul4" }];
    const prisma = makePrisma(data);
    new HolidayQuery(makeBuilder(), prisma, makeHolidayObject());
    const result = await resolvers["readHolidays"]({}, null, { where: null, orderBy: null, paging: null, distinct: null });
    expect(result).toEqual(data);
  });

  it("readHoliday calls findUniqueOrThrow", async () => {
    const data = { id: "h1" };
    const prisma = makePrisma();
    (prisma.prisma.holiday.findUniqueOrThrow as jest.Mock).mockResolvedValue(data);
    new HolidayQuery(makeBuilder(), prisma, makeHolidayObject());
    const result = await resolvers["readHoliday"]({}, null, { where: { id: "h1" } });
    expect(result).toEqual(data);
  });

  it("countHolidays returns the prisma count value", async () => {
    const prisma = makePrisma();
    (prisma.prisma.holiday.count as jest.Mock).mockResolvedValue(11);
    new HolidayQuery(makeBuilder(), prisma, makeHolidayObject());
    const result = await resolvers["countHolidays"](null, { where: null });
    expect(result).toBe(11);
  });

  it("groupHolidays calls prisma.holiday.groupBy", async () => {
    const prisma = makePrisma();
    new HolidayQuery(makeBuilder(), prisma, makeHolidayObject());
    await resolvers["groupHolidays"](null, { by: ["type"], where: null, aggregate: null });
    expect(prisma.prisma.holiday.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["type"] }));
  });

  it("pageHoliday calls findMany with where filter", async () => {
    const prisma = makePrisma();
    new HolidayQuery(makeBuilder(), prisma, makeHolidayObject());
    await resolvers["pageHoliday"]({}, null, { where: { month: { equals: 7 } } });
    expect(prisma.prisma.holiday.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { month: { equals: 7 } } }),
    );
  });
});
