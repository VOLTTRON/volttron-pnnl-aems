
import { BackupMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { BackupObject } from "./object.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
import { BackupSubscriptionPublisher } from "@/services/backup/backup-publisher.service";
import { BackupArchiveService } from "@/services/backup/backup-archive.service";
import { PrismaService } from "@/prisma/prisma.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown, ctx?: unknown) => unknown> = {};

function makeMockT() {
  return {
    prismaField: jest.fn((opts: any) => opts),
    field: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeBackupObject(): BackupObject {
  return {} as unknown as BackupObject;
}

function makeDiscoveryService(): BackupDiscoveryService {
  return { discover: jest.fn() } as unknown as BackupDiscoveryService;
}

function makePublisher() {
  return {
    publishPolicy: jest.fn().mockResolvedValue(undefined),
    publishDestination: jest.fn().mockResolvedValue(undefined),
    publishRun: jest.fn().mockResolvedValue(undefined),
    publishKey: jest.fn().mockResolvedValue(undefined),
  } as unknown as BackupSubscriptionPublisher;
}

function makeArchiveService(): BackupArchiveService {
  return {
    deleteArchive: jest.fn().mockResolvedValue(undefined),
  } as unknown as BackupArchiveService;
}

function makePrisma() {
  return {
    prisma: {
      backupPolicy: {
        findFirst: jest.fn().mockResolvedValue({ id: "bp1", enabled: false, cron: "0 2 * * *", retentionDays: 30 }),
        update: jest.fn().mockResolvedValue({ id: "bp1", enabled: true }),
        create: jest.fn().mockResolvedValue({ id: "default", enabled: false }),
      },
      backupDestination: {
        create: jest.fn().mockResolvedValue({ id: "bd1", name: "MyDest" }),
        update: jest.fn().mockResolvedValue({ id: "bd1", name: "MyDest" }),
        delete: jest.fn().mockResolvedValue({ id: "bd1", name: "MyDest" }),
      },
      backupRun: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: "br1", status: "Queued" }),
        update: jest.fn().mockResolvedValue({ id: "br1", cancelRequested: true }),
      },
      backupRunDestination: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "brd1" }),
      },
      backupKey: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "bk1", acknowledged: true, privateKeyPath: null }),
        update: jest.fn().mockResolvedValue({ id: "bk1" }),
      },
    },
  } as unknown as PrismaService;
}

const adminCtx = { user: { id: "u1", authRoles: { admin: true } } };

describe("BackupMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("updateBackupPolicy resolver", () => {
    it("updates an existing policy when one is found", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["updateBackupPolicy"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { enabled: true, cron: "0 3 * * *" });

      expect(prisma.prisma.backupPolicy.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ enabled: true, cron: "0 3 * * *" }) }),
      );
    });

    it("creates a new policy when none exists", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupPolicy.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.prisma.backupPolicy.create as jest.Mock).mockResolvedValue({ id: "default", enabled: true });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["updateBackupPolicy"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { enabled: true });

      expect(prisma.prisma.backupPolicy.create).toHaveBeenCalled();
    });

    it("publishes a policy event after update", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["updateBackupPolicy"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { enabled: true });

      expect(publisher.publishPolicy).toHaveBeenCalledWith("bp1", expect.anything());
    });
  });

  describe("createBackupDestination resolver", () => {
    it("creates a destination with output=null for Local type", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["createBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { name: "LocalDest", type: "Local" });

      expect(prisma.prisma.backupDestination.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ output: null }) }),
      );
    });

    it("throws if non-Local type has no output", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["createBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await expect(resolve({}, null, { name: "S3Dest", type: "S3" })).rejects.toThrow(
        "Destination type S3 requires an output path.",
      );
      expect(prisma.prisma.backupDestination.create).not.toHaveBeenCalled();
    });

    it("creates with provided output for non-Local type", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["createBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { name: "S3Dest", type: "S3", output: "s3://my-bucket" });

      expect(prisma.prisma.backupDestination.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ output: "s3://my-bucket" }) }),
      );
    });
  });

  describe("triggerBackupRun resolver", () => {
    it("creates a queued run when no run is inflight", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["triggerBackupRun"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      const result = await resolve({}, null, {}, adminCtx);

      expect(prisma.prisma.backupRun.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "Queued", trigger: "Manual" }) }),
      );
      expect(result).toEqual(expect.objectContaining({ id: "br1" }));
    });

    it("throws when a run is already inflight", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupRun.count as jest.Mock).mockResolvedValue(1);
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["triggerBackupRun"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await expect(resolve({}, null, {}, adminCtx)).rejects.toThrow(
        "A backup is already in progress",
      );
      expect(prisma.prisma.backupRun.create).not.toHaveBeenCalled();
    });
  });

  describe("cancelBackupRun resolver", () => {
    it("sets cancelRequested=true on the run", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["cancelBackupRun"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { id: "br1" });

      expect(prisma.prisma.backupRun.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "br1" }, data: { cancelRequested: true } }),
      );
    });
  });

  describe("acknowledgeBackupKey resolver", () => {
    it("sets acknowledged=true with acknowledgedAt and acknowledgedById", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.update as jest.Mock).mockResolvedValue({ id: "bk1", acknowledged: true });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["acknowledgeBackupKey"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { id: "bk1" }, adminCtx);

      expect(prisma.prisma.backupKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "bk1" },
          data: expect.objectContaining({
            acknowledged: true,
            acknowledgedById: "u1",
          }),
        }),
      );
    });

    it("publishes a key event after acknowledge", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.update as jest.Mock).mockResolvedValue({ id: "bk1" });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["acknowledgeBackupKey"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { id: "bk1" }, adminCtx);

      expect(publisher.publishKey).toHaveBeenCalledWith("bk1", expect.anything());
    });
  });

  // TODO: test downloadBackupPrivateKey with mocked fs — requires fs/promises mock
  // TODO: test rotateBackupKey — complex multi-step operation
});
