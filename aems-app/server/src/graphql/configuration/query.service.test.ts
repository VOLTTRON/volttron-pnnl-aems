import { ConfigurationQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { ConfigurationObject } from "./object.service";
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

function makeConfigurationObject(): ConfigurationObject {
  return { ConfigurationFields: "ConfigurationFields" } as unknown as ConfigurationObject;
}

function makePrisma(data: unknown = []) {
  return {
    prisma: {
      configuration: {
        findMany: jest.fn().mockResolvedValue(data),
        findUniqueOrThrow: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("ConfigurationQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected query fields", () => {
    new ConfigurationQuery(makeBuilder(), makePrisma(), makeConfigurationObject());
    expect(Object.keys(resolvers).sort()).toEqual(
      ["countConfigurations", "groupConfigurations", "pageConfiguration", "readConfiguration", "readConfigurations"].sort(),
    );
  });

  it("readConfigurations calls prisma.configuration.findMany", async () => {
    const data = [{ id: "cfg1", label: "L" }];
    const prisma = makePrisma(data);
    new ConfigurationQuery(makeBuilder(), prisma, makeConfigurationObject());
    const result = await resolvers["readConfigurations"]({}, null, { where: null, orderBy: null, paging: null, distinct: null });
    expect(result).toEqual(data);
  });

  it("readConfiguration calls findUniqueOrThrow with where arg", async () => {
    const data = { id: "cfg1" };
    const prisma = makePrisma();
    (prisma.prisma.configuration.findUniqueOrThrow as jest.Mock).mockResolvedValue(data);
    new ConfigurationQuery(makeBuilder(), prisma, makeConfigurationObject());
    const result = await resolvers["readConfiguration"]({}, null, { where: { id: "cfg1" } });
    expect(result).toEqual(data);
  });

  it("countConfigurations returns the prisma count value", async () => {
    const prisma = makePrisma();
    (prisma.prisma.configuration.count as jest.Mock).mockResolvedValue(3);
    new ConfigurationQuery(makeBuilder(), prisma, makeConfigurationObject());
    const result = await resolvers["countConfigurations"](null, { where: null });
    expect(result).toBe(3);
  });

  it("groupConfigurations calls prisma.configuration.groupBy with by fields", async () => {
    const prisma = makePrisma();
    new ConfigurationQuery(makeBuilder(), prisma, makeConfigurationObject());
    await resolvers["groupConfigurations"](null, { by: ["label"], where: null, aggregate: null });
    expect(prisma.prisma.configuration.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["label"] }));
  });

  it("pageConfiguration calls findMany with where filter", async () => {
    const prisma = makePrisma();
    new ConfigurationQuery(makeBuilder(), prisma, makeConfigurationObject());
    await resolvers["pageConfiguration"]({}, null, { where: { label: { equals: "x" } } });
    expect(prisma.prisma.configuration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { label: { equals: "x" } } }),
    );
  });
});
