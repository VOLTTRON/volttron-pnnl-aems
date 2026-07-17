import { ChangeQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { ChangeObject } from "./object.service";
import { UserQuery } from "../user/query.service";
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

function makeChangeObject(): ChangeObject {
  return { ChangeFields: "ChangeFields", ChangeMutation: "ChangeMutation" } as unknown as ChangeObject;
}

function makeUserQuery(): UserQuery {
  return { UserWhere: "UserWhere" } as unknown as UserQuery;
}

function makePrisma(data: unknown = []) {
  return {
    prisma: {
      change: {
        findMany: jest.fn().mockResolvedValue(data),
        findUniqueOrThrow: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

describe("ChangeQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected query fields", () => {
    const builder = makeBuilder();
    new ChangeQuery(builder, makePrisma(), makeChangeObject(), makeUserQuery());
    expect(Object.keys(resolvers).sort()).toEqual(
      ["countChanges", "groupChanges", "pageChange", "readChange", "readChanges"].sort(),
    );
  });

  it("readChanges calls prisma.change.findMany and returns results", async () => {
    const data = [{ id: "c1", table: "User" }];
    const prisma = makePrisma(data);
    new ChangeQuery(makeBuilder(), prisma, makeChangeObject(), makeUserQuery());
    const result = await resolvers["readChanges"]({}, null, { where: null, orderBy: null, paging: null, distinct: null });
    expect(prisma.prisma.change.findMany).toHaveBeenCalled();
    expect(result).toEqual(data);
  });

  it("readChange calls findUniqueOrThrow with where arg", async () => {
    const data = { id: "c1", table: "User" };
    const prisma = makePrisma();
    (prisma.prisma.change.findUniqueOrThrow as jest.Mock).mockResolvedValue(data);
    new ChangeQuery(makeBuilder(), prisma, makeChangeObject(), makeUserQuery());
    const result = await resolvers["readChange"]({}, null, { where: { id: "c1" } });
    expect(prisma.prisma.change.findUniqueOrThrow).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "c1" } }));
    expect(result).toEqual(data);
  });

  it("countChanges returns the prisma count value", async () => {
    const prisma = makePrisma();
    (prisma.prisma.change.count as jest.Mock).mockResolvedValue(5);
    new ChangeQuery(makeBuilder(), prisma, makeChangeObject(), makeUserQuery());
    const result = await resolvers["countChanges"](null, { where: null });
    expect(result).toBe(5);
  });

  it("groupChanges calls prisma.change.groupBy with by fields", async () => {
    const prisma = makePrisma();
    new ChangeQuery(makeBuilder(), prisma, makeChangeObject(), makeUserQuery());
    await resolvers["groupChanges"](null, { by: ["table"], where: null, aggregate: null });
    expect(prisma.prisma.change.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["table"] }));
  });

  it("pageChange calls prisma.change.findMany with where filter", async () => {
    const prisma = makePrisma();
    new ChangeQuery(makeBuilder(), prisma, makeChangeObject(), makeUserQuery());
    await resolvers["pageChange"]({}, null, { where: { table: { equals: "User" } } });
    expect(prisma.prisma.change.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { table: { equals: "User" } } }),
    );
  });
});
