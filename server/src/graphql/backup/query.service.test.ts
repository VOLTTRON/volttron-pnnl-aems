
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

    it("readBackupPolicies: passes provided where/orderBy/paging/distinct", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupPolicies"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, {
        where: { enabled: true },
        orderBy: [{ createdAt: "desc" }],
        paging: { take: 5, skip: 0 },
        distinct: ["id"],
      }, adminCtx);

      expect(prisma.prisma.backupPolicy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { enabled: true }, orderBy: [{ createdAt: "desc" }], take: 5 }),
      );
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

    it("countBackupPolicies: passes where when provided", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupPolicy.count as jest.Mock).mockResolvedValue(1);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["countBackupPolicies"] as (r: unknown, a: unknown, c: unknown) => Promise<number>;
      await resolve(null, { where: { enabled: true } }, adminCtx);

      expect(prisma.prisma.backupPolicy.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { enabled: true } }),
      );
    });

    it("pageBackupPolicy: calls prisma.backupPolicy.findMany", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["pageBackupPolicy"] as (q: unknown, p: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve({}, null, { where: null }, adminCtx, null);
      expect(prisma.prisma.backupPolicy.findMany).toHaveBeenCalled();
    });

    it("pageBackupPolicy: passes provided where", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["pageBackupPolicy"] as (q: unknown, p: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { enabled: true } }, adminCtx, null);
      expect(prisma.prisma.backupPolicy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { enabled: true } }),
      );
    });

    it("readBackupPolicy: calls prisma.backupPolicy.findUniqueOrThrow", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupPolicy"] as (q: unknown, r: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "bp1" } }, adminCtx, null);
      expect(prisma.prisma.backupPolicy.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "bp1" } }),
      );
    });

    it("groupBackupPolicies: calls prisma.backupPolicy.groupBy with aggregate=null (no-aggregate branch)", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["groupBackupPolicies"] as (r: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve(null, { by: ["id"], where: null, aggregate: null }, adminCtx, null);
      expect(prisma.prisma.backupPolicy.groupBy).toHaveBeenCalled();
    });

    it("groupBackupPolicies: passes where when provided", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["groupBackupPolicies"] as (r: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve(null, { by: ["id"], where: { enabled: true }, aggregate: null }, adminCtx, null);
      expect(prisma.prisma.backupPolicy.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { enabled: true } }),
      );
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

    it("readBackupDestinations: passes provided where/orderBy/paging/distinct", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupDestinations"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, {
        where: { enabled: true },
        orderBy: [{ order: "asc" }],
        paging: { take: 10, skip: 0 },
        distinct: ["id"],
      }, adminCtx);

      expect(prisma.prisma.backupDestination.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { enabled: true }, orderBy: [{ order: "asc" }] }),
      );
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

    it("pageBackupDestination: calls prisma.backupDestination.findMany with provided where", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["pageBackupDestination"] as (q: unknown, p: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { enabled: true } }, adminCtx, null);
      expect(prisma.prisma.backupDestination.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { enabled: true } }),
      );
    });

    it("readBackupDestination: calls prisma.backupDestination.findUniqueOrThrow", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupDestination"] as (q: unknown, r: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "bd1" } }, adminCtx, null);
      expect(prisma.prisma.backupDestination.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "bd1" } }),
      );
    });

    it("groupBackupDestinations: calls prisma.backupDestination.groupBy", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["groupBackupDestinations"] as (r: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve(null, { by: ["id"], where: { enabled: true }, aggregate: null }, adminCtx, null);
      expect(prisma.prisma.backupDestination.groupBy).toHaveBeenCalled();
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

    it("readBackupRuns: passes provided where/orderBy/paging/distinct", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupRuns"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, {
        where: { cancelRequested: false },
        orderBy: [{ startedAt: "desc" }],
        paging: { take: 20 },
        distinct: ["id"],
      }, adminCtx);

      expect(prisma.prisma.backupRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cancelRequested: false }, orderBy: [{ startedAt: "desc" }] }),
      );
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

    it("pageBackupRun: calls prisma.backupRun.findMany with provided where", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["pageBackupRun"] as (q: unknown, p: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { cancelRequested: true } }, adminCtx, null);
      expect(prisma.prisma.backupRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cancelRequested: true } }),
      );
    });

    it("countBackupRuns: calls prisma.backupRun.count and passes where", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupRun.count as jest.Mock).mockResolvedValue(5);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["countBackupRuns"] as (r: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      const result = await resolve(null, { where: null }, adminCtx, null);
      expect(result).toBe(5);
    });

    it("groupBackupRuns: calls prisma.backupRun.groupBy", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["groupBackupRuns"] as (r: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve(null, { by: ["id"], where: null, aggregate: null }, adminCtx, null);
      expect(prisma.prisma.backupRun.groupBy).toHaveBeenCalled();
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

    it("readBackupKeys: passes provided where/orderBy/paging/distinct", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["readBackupKeys"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      await resolve({}, null, {
        where: { active: true },
        orderBy: [{ createdAt: "asc" }],
        paging: { take: 5 },
        distinct: ["id"],
      }, adminCtx);

      expect(prisma.prisma.backupKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { active: true }, orderBy: [{ createdAt: "asc" }] }),
      );
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

    it("pageBackupKey: calls prisma.backupKey.findMany with provided where", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["pageBackupKey"] as (q: unknown, p: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { active: true } }, adminCtx, null);
      expect(prisma.prisma.backupKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { active: true } }),
      );
    });

    it("countBackupKeys: calls prisma.backupKey.count", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.count as jest.Mock).mockResolvedValue(2);
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["countBackupKeys"] as (r: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      const result = await resolve(null, { where: { active: true } }, adminCtx, null);
      expect(result).toBe(2);
    });

    it("groupBackupKeys: calls prisma.backupKey.groupBy", async () => {
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), makeDiscoveryService());

      const resolve = resolvers["groupBackupKeys"] as (r: unknown, a: unknown, c: unknown, i: unknown) => Promise<unknown>;
      await resolve(null, { by: ["id"], where: { active: true }, aggregate: null }, adminCtx, null);
      expect(prisma.prisma.backupKey.groupBy).toHaveBeenCalled();
    });
  });

  describe("discoverBackupSources", () => {
    it("calls backupDiscoveryService.discover and returns result", async () => {
      const discoveryResult = { services: [{ name: "db" }], volumes: [], paths: [], envFiles: [] };
      const discovery = makeDiscoveryService();
      (discovery.discover as jest.Mock).mockResolvedValue(discoveryResult);
      const prisma = makePrisma();
      new BackupQuery(makeBuilder(), prisma, makeBackupObject(), makeUserQuery(), discovery);

      const resolve = resolvers["discoverBackupSources"] as () => Promise<unknown>;
      const result = await resolve();
      expect(result).toEqual(discoveryResult);
    });
  });
});
