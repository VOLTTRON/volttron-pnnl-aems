
import { BackupQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { BackupObject } from "./object.service";
import { UserQuery } from "../user/query.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
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
    IntFilter: "IntFilter",
    BooleanFilter: "BooleanFilter",
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

function makeBackupObject(): BackupObject {
  return {
    BackupPolicyFields: "BackupPolicyFields",
    BackupDestinationFields: "BackupDestinationFields",
    BackupRunFields: "BackupRunFields",
    BackupKeyFields: "BackupKeyFields",
    BackupDestinationType: "BackupDestinationType",
    BackupRunStatus: "BackupRunStatus",
    BackupRunTrigger: "BackupRunTrigger",
    BackupKeyAlgorithm: "BackupKeyAlgorithm",
    BackupDiscoveryObject: "BackupDiscoveryObject",
  } as unknown as BackupObject;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery;
}

function makeDiscoveryService(): BackupDiscoveryService {
  return { discover: jest.fn().mockResolvedValue({ services: [], volumes: [], paths: [], envFiles: [] }) } as unknown as BackupDiscoveryService;
}

function makePrisma() {
  return {
    prisma: {
      backupPolicy: {
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "bp1" }),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      backupDestination: {
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "bd1" }),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      backupRun: {
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "br1" }),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      backupKey: {
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "bk1" }),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    },
  } as unknown as PrismaService;
}

const adminCtx = { user: { id: "u1", authRoles: { admin: true } } };

describe("BackupQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("BackupPolicy queries", () => {
    it("readBackupPolicies: calls prisma.backupPolicy.findMany and returns results", async () => {
      const policies = [{ id: "bp1", enabled: true }];
      const prisma = makePrisma();
      (prisma.prisma.backupPolicy.findMany as jest.Mock).mockResolvedValue(policies);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupPolicies"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.backupPolicy.findMany).toHaveBeenCalled();
      expect(result).toEqual(policies);
    });

    it("countBackupPolicies: returns count from prisma.backupPolicy.count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupPolicy.count as jest.Mock).mockResolvedValue(2);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["countBackupPolicies"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: null }, adminCtx);

      expect(prisma.prisma.backupPolicy.count).toHaveBeenCalled();
      expect(result).toBe(2);
    });
  });

  describe("BackupDestination queries", () => {
    it("readBackupDestinations: calls prisma.backupDestination.findMany", async () => {
      const destinations = [{ id: "bd1", name: "Local" }];
      const prisma = makePrisma();
      (prisma.prisma.backupDestination.findMany as jest.Mock).mockResolvedValue(destinations);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupDestinations"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.backupDestination.findMany).toHaveBeenCalled();
      expect(result).toEqual(destinations);
    });

    it("countBackupDestinations: returns count from prisma.backupDestination.count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupDestination.count as jest.Mock).mockResolvedValue(3);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["countBackupDestinations"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      const result = await resolve(null, { where: null }, adminCtx);

      expect(prisma.prisma.backupDestination.count).toHaveBeenCalled();
      expect(result).toBe(3);
    });
  });

  describe("BackupRun queries", () => {
    it("readBackupRuns: calls prisma.backupRun.findMany", async () => {
      const runs = [{ id: "br1", status: "Completed" }];
      const prisma = makePrisma();
      (prisma.prisma.backupRun.findMany as jest.Mock).mockResolvedValue(runs);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupRuns"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.backupRun.findMany).toHaveBeenCalled();
      expect(result).toEqual(runs);
    });

    it("readBackupRun: calls prisma.backupRun.findUniqueOrThrow with where arg", async () => {
      const run = { id: "br1", status: "Running" };
      const prisma = makePrisma();
      (prisma.prisma.backupRun.findUniqueOrThrow as jest.Mock).mockResolvedValue(run);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupRun"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: { id: "br1" } }, adminCtx);

      expect(prisma.prisma.backupRun.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "br1" } }),
      );
      expect(result).toEqual(run);
    });
  });

  describe("BackupKey queries", () => {
    it("readBackupKeys: calls prisma.backupKey.findMany", async () => {
      const keys = [{ id: "bk1", active: true }];
      const prisma = makePrisma();
      (prisma.prisma.backupKey.findMany as jest.Mock).mockResolvedValue(keys);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupKeys"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: null, orderBy: null, paging: null, distinct: null }, adminCtx);

      expect(prisma.prisma.backupKey.findMany).toHaveBeenCalled();
      expect(result).toEqual(keys);
    });

    it("readBackupKey: calls prisma.backupKey.findUniqueOrThrow with where arg", async () => {
      const key = { id: "bk1", active: true };
      const prisma = makePrisma();
      (prisma.prisma.backupKey.findUniqueOrThrow as jest.Mock).mockResolvedValue(key);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupKey"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { where: { id: "bk1" } }, adminCtx);

      expect(prisma.prisma.backupKey.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "bk1" } }),
      );
      expect(result).toEqual(key);
    });
  });
});
