
import { BackupMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { BackupObject } from "./object.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
import { BackupSubscriptionPublisher } from "@/services/backup/backup-publisher.service";
import { BackupArchiveService } from "@/services/backup/backup-archive.service";
import { PrismaService } from "@/prisma/prisma.service";
import * as fs from "fs/promises";

jest.mock("fs/promises");

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

  describe("updateBackupPolicy resolver — partial args branches", () => {
    it("skips null args when updating policy", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["updateBackupPolicy"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, {
        retentionDays: 14,
        excludeVolumes: ["vol-a"],
        excludePaths: ["/tmp"],
        excludeServices: ["svc"],
        excludeEnvFiles: [".env.prod"],
        extraEnvFiles: [".env.extra"],
      });

      expect(prisma.prisma.backupPolicy.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ retentionDays: 14 }) }),
      );
    });
  });

  describe("createBackupDestination resolver — edge cases", () => {
    it("throws when non-Local type has empty-string output", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["createBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await expect(resolve({}, null, { name: "S3Dest", type: "S3", output: "  " })).rejects.toThrow(
        "Destination type S3 requires an output path.",
      );
    });

    it("creates a destination with null policy when none exists (findOrCreate path)", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupPolicy.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.prisma.backupPolicy.create as jest.Mock).mockResolvedValue({ id: "default" });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["createBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { name: "LocalDest", type: "Local", enabled: false, sseMode: "aws:sse", sseKmsKeyId: "key", order: 2 });

      expect(prisma.prisma.backupPolicy.create).toHaveBeenCalled();
      expect(prisma.prisma.backupDestination.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ enabled: false, order: 2 }) }),
      );
    });
  });

  describe("updateBackupDestination resolver", () => {
    it("clears output when type is changed to Local", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["updateBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { id: "bd1", type: "Local" });

      expect(prisma.prisma.backupDestination.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ output: null }) }),
      );
    });

    it("throws when switching to non-Local type without output", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["updateBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await expect(resolve({}, null, { id: "bd1", type: "S3" })).rejects.toThrow(
        "Destination type S3 requires an output path.",
      );
    });

    it("updates output when type is null but output is provided", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["updateBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { id: "bd1", name: "Updated", enabled: true, sseMode: "s3:sse", sseKmsKeyId: "kms-id", order: 1, output: "s3://updated" });

      expect(prisma.prisma.backupDestination.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ output: "s3://updated" }) }),
      );
    });

    it("throws when switching non-Local type to empty output string", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["updateBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await expect(resolve({}, null, { id: "bd1", type: "S3", output: "" })).rejects.toThrow(
        "Destination type S3 requires an output path.",
      );
    });
  });

  describe("deleteBackupDestination resolver", () => {
    it("deletes the destination and publishes event", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["deleteBackupDestination"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { id: "bd1" });

      expect(prisma.prisma.backupDestination.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "bd1" } }),
      );
      expect(publisher.publishDestination).toHaveBeenCalled();
    });
  });

  describe("triggerBackupRun resolver — no user context", () => {
    it("uses null for requestedById when no user in context", async () => {
      const prisma = makePrisma();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["triggerBackupRun"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, {}, undefined);

      expect(prisma.prisma.backupRun.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ requestedById: null }) }),
      );
    });
  });

  describe("rotateBackupKey resolver", () => {
    it("deactivates current key and returns latest", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: "bk-current", active: true })
        .mockResolvedValueOnce({ id: "bk-latest", active: false });
      (prisma.prisma.backupKey.update as jest.Mock).mockResolvedValue({ id: "bk-current" });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["rotateBackupKey"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      const result = await resolve({}, null, {});

      expect(prisma.prisma.backupKey.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "bk-current" }, data: expect.objectContaining({ active: false }) }),
      );
      expect(result).toEqual(expect.objectContaining({ id: "bk-latest" }));
    });

    it("skips deactivation when no active key exists and returns current=null", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["rotateBackupKey"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      const result = await resolve({}, null, {});

      expect(prisma.prisma.backupKey.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("downloadBackupPrivateKey resolver", () => {
    it("reads and returns private key contents when key is acknowledged and has a path", async () => {
      const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
      mockReadFile.mockResolvedValue("-----BEGIN AGE KEY-----\nAGE-SECRET-KEY-1...\n-----END AGE KEY-----\n" as unknown as Buffer);

      const prisma = makePrisma();
      (prisma.prisma.backupKey.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: "bk-dl",
        acknowledged: true,
        privateKeyPath: "/run/secrets/backup_key",
        fingerprint: "fp-dl",
      });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["downloadBackupPrivateKey"] as (r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      const result = await resolve(null, { id: "bk-dl" }, { user: { id: "admin-1" } });

      expect(result).toContain("AGE-SECRET-KEY");
    });

    it("throws when key is not acknowledged", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: "bk-unack",
        acknowledged: false,
        privateKeyPath: "/run/secrets/backup_key",
        fingerprint: "fp-unack",
      });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["downloadBackupPrivateKey"] as (r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await expect(resolve(null, { id: "bk-unack" }, { user: { id: "admin-2" } })).rejects.toThrow(
        "acknowledge",
      );
    });

    it("throws when key has no privateKeyPath", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: "bk-nopath",
        acknowledged: true,
        privateKeyPath: null,
        fingerprint: "fp-nopath",
      });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["downloadBackupPrivateKey"] as (r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await expect(resolve(null, { id: "bk-nopath" }, { user: { id: "admin-3" } })).rejects.toThrow(
        "not available",
      );
    });

    it("throws rate-limit error when download is called twice within cooldown", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: "bk-rate",
        acknowledged: true,
        privateKeyPath: "/run/secrets/backup_key",
        fingerprint: "fp-rate",
      });
      const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
      mockReadFile.mockResolvedValue("key-content" as unknown as Buffer);

      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["downloadBackupPrivateKey"] as (r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      // First call should succeed
      await resolve(null, { id: "bk-rate" }, { user: { id: "rate-user" } });
      // Second call within cooldown should fail
      await expect(resolve(null, { id: "bk-rate" }, { user: { id: "rate-user" } })).rejects.toThrow(
        "Please wait before downloading",
      );
    });

    it("uses 'anonymous' as userId when no user in context", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: "bk-anon",
        acknowledged: true,
        privateKeyPath: null,
        fingerprint: "fp-anon",
      });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["downloadBackupPrivateKey"] as (r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await expect(resolve(null, { id: "bk-anon" }, undefined)).rejects.toThrow("not available");
    });
  });

  describe("deleteBackupArchive resolver", () => {
    it("deletes the archive and returns the updated run destination", async () => {
      const prisma = makePrisma();
      const archiveService = makeArchiveService();
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), archiveService);

      const resolve = resolvers["deleteBackupArchive"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { runDestinationId: "brd1" });

      expect(archiveService.deleteArchive).toHaveBeenCalledWith("brd1");
      expect(result).toEqual(expect.objectContaining({ id: "brd1" }));
    });
  });

  describe("acknowledgeBackupKey resolver — no user context", () => {
    it("uses null for acknowledgedById when no user in context", async () => {
      const prisma = makePrisma();
      (prisma.prisma.backupKey.update as jest.Mock).mockResolvedValue({ id: "bk1" });
      const publisher = makePublisher();
      new BackupMutation(makeBuilder(), prisma, publisher, makeBackupObject(), makeDiscoveryService(), makeArchiveService());

      const resolve = resolvers["acknowledgeBackupKey"] as (q: unknown, r: unknown, a: unknown, c?: unknown) => Promise<unknown>;
      await resolve({}, null, { id: "bk1" }, undefined);

      expect(prisma.prisma.backupKey.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ acknowledgedById: null }) }),
      );
    });
  });
});
