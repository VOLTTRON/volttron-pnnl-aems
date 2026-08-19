import { BackupWorkerService } from "./backup.service";
import { PrismaService } from "@/prisma/prisma.service";
import { BackupSubscriptionPublisher } from "@/services/backup/backup-publisher.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
import { BackupComponentStatus, BackupComponentType, BackupKeyAlgorithm, BackupRunStatus } from "@prisma/client";
import { NotFoundException } from "@nestjs/common";
import * as fs from "fs/promises";
import { Mutation } from "@local/common";

jest.mock("fs/promises");
const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;

function makePublisher(): jest.Mocked<BackupSubscriptionPublisher> {
  return {
    publishRun: jest.fn().mockResolvedValue(undefined),
    publishKey: jest.fn().mockResolvedValue(undefined),
    publishPolicy: jest.fn().mockResolvedValue(undefined),
    publishDestination: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<BackupSubscriptionPublisher>;
}

function makeDiscovery(): jest.Mocked<BackupDiscoveryService> {
  return {
    discover: jest.fn().mockResolvedValue({ services: [], volumes: [], paths: [], envFiles: [] }),
  } as unknown as jest.Mocked<BackupDiscoveryService>;
}

function makePrisma() {
  return {
    prisma: {
      $queryRaw: jest.fn(),
      backupRun: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      backupPolicy: {
        findUniqueOrThrow: jest.fn(),
      },
      backupDestination: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      backupKey: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      backupComponent: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      backupRunDestination: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
    },
  };
}

describe("BackupWorkerService", () => {
  let service: BackupWorkerService;
  let prisma: ReturnType<typeof makePrisma>;
  let publisher: jest.Mocked<BackupSubscriptionPublisher>;
  let discovery: jest.Mocked<BackupDiscoveryService>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = makePrisma();
    publisher = makePublisher();
    discovery = makeDiscovery();
    service = new BackupWorkerService(
      prisma as unknown as PrismaService,
      publisher,
      discovery,
    );
  });

  describe("claimNextRun()", () => {
    it("returns null when there is no queued run", async () => {
      prisma.prisma.$queryRaw.mockResolvedValue([]);
      const result = await service.claimNextRun();
      expect(result).toBeNull();
    });

    it("returns ClaimResult when a run is claimed", async () => {
      const runRow = { id: "run-1", policyId: "pol-1", trigger: "Scheduled", cancelRequested: false };
      prisma.prisma.$queryRaw.mockResolvedValue([runRow]);
      prisma.prisma.backupPolicy.findUniqueOrThrow.mockResolvedValue({
        id: "pol-1",
        enabled: true,
        cron: "0 2 * * *",
        retentionDays: 30,
        excludeVolumes: [],
        excludePaths: [],
        excludeServices: [],
        excludeEnvFiles: [],
        extraEnvFiles: [],
      });
      const result = await service.claimNextRun();
      expect(result).not.toBeNull();
      expect(result?.run.id).toBe("run-1");
      expect(publisher.publishRun).toHaveBeenCalledWith("run-1", Mutation.Updated);
    });

    it("still returns ClaimResult when discovery fails (auto-exclude skipped)", async () => {
      const runRow = { id: "run-2", policyId: "pol-1", trigger: "Manual", cancelRequested: false };
      prisma.prisma.$queryRaw.mockResolvedValue([runRow]);
      prisma.prisma.backupPolicy.findUniqueOrThrow.mockResolvedValue({
        id: "pol-1",
        enabled: true,
        cron: null,
        retentionDays: 7,
        excludeVolumes: [],
        excludePaths: [],
        excludeServices: [],
        excludeEnvFiles: [],
        extraEnvFiles: [],
      });
      discovery.discover.mockRejectedValue(new Error("network error"));
      const result = await service.claimNextRun();
      expect(result?.run.id).toBe("run-2");
    });

    it("merges auto-excluded volumes/paths from discovery into policy excludes", async () => {
      const runRow = { id: "run-3", policyId: "pol-2", trigger: "Scheduled", cancelRequested: false };
      prisma.prisma.$queryRaw.mockResolvedValue([runRow]);
      prisma.prisma.backupPolicy.findUniqueOrThrow.mockResolvedValue({
        id: "pol-2",
        enabled: true,
        cron: "0 3 * * *",
        retentionDays: 14,
        excludeVolumes: ["user-vol"],
        excludePaths: ["/data"],
        excludeServices: [],
        excludeEnvFiles: [],
        extraEnvFiles: [],
      });
      discovery.discover.mockResolvedValue({
        volumes: [
          { name: "auto-vol", autoExclude: true, services: [], autoExcludeReason: null },
          { name: "keep-vol", autoExclude: false, services: [], autoExcludeReason: null },
        ],
        paths: [{ path: "/tmp", type: "directory" as const, autoExclude: true, services: [], autoExcludeReason: null }],
        services: [
          { name: "db", backupStrategy: "pg_dump" as const, engine: "Postgres" as const, hasVolume: false, image: null, imageFamily: null, autoExclude: false, autoExcludeReason: null },
          { name: "cache", backupStrategy: null, engine: null, hasVolume: false, image: null, imageFamily: null, autoExclude: false, autoExcludeReason: null },
        ],
        envFiles: [],
      });
      prisma.prisma.backupKey.findFirst.mockResolvedValue({ fingerprint: "abc123" });
      const result = await service.claimNextRun();
      expect(result?.policy.excludeVolumes).toContain("auto-vol");
      expect(result?.policy.excludeVolumes).toContain("user-vol");
      expect(result?.policy.excludePaths).toContain("/tmp");
      expect(result?.policy.includeDatabases).toEqual(["db:postgres"]);
      expect(result?.activeKeyFingerprint).toBe("abc123");
    });
  });

  describe("reconcileStale()", () => {
    it("returns 0 when there are no stale candidates", async () => {
      prisma.prisma.backupRun.findMany.mockResolvedValue([]);
      const count = await service.reconcileStale(300_000);
      expect(count).toBe(0);
    });

    it("marks Running runs with no archive as Failed", async () => {
      prisma.prisma.backupRun.findMany.mockResolvedValue([{ id: "run-1", policyId: "pol-1", status: BackupRunStatus.Running }]);
      mockStat.mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
      const count = await service.reconcileStale(300_000);
      expect(count).toBe(1);
      expect(prisma.prisma.backupRun.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: BackupRunStatus.Failed }) }),
      );
    });

    it("recovers Failed runs when an archive is found on disk", async () => {
      prisma.prisma.backupRun.findMany.mockResolvedValue([
        { id: "run-done", policyId: "pol-1", status: BackupRunStatus.Failed },
      ]);
      mockStat.mockResolvedValue({ isFile: () => true, size: 1024 } as ReturnType<typeof fs.stat> extends Promise<infer T> ? T : never);
      prisma.prisma.backupRun.update.mockResolvedValue({});
      prisma.prisma.backupDestination.findMany.mockResolvedValue([]);
      const count = await service.reconcileStale(300_000);
      expect(count).toBe(1);
      expect(prisma.prisma.backupRun.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: BackupRunStatus.Success }) }),
      );
    });

    it("backfills a LocalDestination row when recovering a run that has no existing run-destination", async () => {
      prisma.prisma.backupRun.findMany.mockResolvedValue([
        { id: "run-local", policyId: "pol-1", status: BackupRunStatus.Failed },
      ]);
      mockStat.mockResolvedValue({ isFile: () => true, size: 2048 } as ReturnType<typeof fs.stat> extends Promise<infer T> ? T : never);
      prisma.prisma.backupRun.update.mockResolvedValue({});
      prisma.prisma.backupDestination.findMany.mockResolvedValue([{ id: "dest-local" }]);
      prisma.prisma.backupRunDestination.findFirst.mockResolvedValue(null);
      prisma.prisma.backupKey.findFirst.mockResolvedValue({ fingerprint: "fp-recover" });
      await service.reconcileStale(300_000);
      expect(prisma.prisma.backupRunDestination.create).toHaveBeenCalled();
    });

    it("skips creating run-destination row when one already exists", async () => {
      prisma.prisma.backupRun.findMany.mockResolvedValue([
        { id: "run-dup", policyId: "pol-1", status: BackupRunStatus.Failed },
      ]);
      mockStat.mockResolvedValue({ isFile: () => true, size: 512 } as ReturnType<typeof fs.stat> extends Promise<infer T> ? T : never);
      prisma.prisma.backupRun.update.mockResolvedValue({});
      prisma.prisma.backupDestination.findMany.mockResolvedValue([{ id: "dest-existing" }]);
      prisma.prisma.backupRunDestination.findFirst.mockResolvedValue({ id: "rd-exists" });
      await service.reconcileStale(300_000);
      expect(prisma.prisma.backupRunDestination.create).not.toHaveBeenCalled();
    });

    it("logs only recovered message when no runs failed", async () => {
      prisma.prisma.backupRun.findMany.mockResolvedValue([
        { id: "run-recover", policyId: "pol-1", status: BackupRunStatus.Failed },
      ]);
      mockStat.mockResolvedValue({ isFile: () => true, size: 512 } as ReturnType<typeof fs.stat> extends Promise<infer T> ? T : never);
      prisma.prisma.backupRun.update.mockResolvedValue({});
      prisma.prisma.backupDestination.findMany.mockResolvedValue([]);
      const count = await service.reconcileStale(300_000);
      expect(count).toBe(1);
    });

    it("skips Failed runs with no archive on disk (null fingerprint/path)", async () => {
      prisma.prisma.backupRun.findMany.mockResolvedValue([
        { id: "run-noarch", policyId: "pol-1", status: BackupRunStatus.Failed },
      ]);
      mockStat.mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
      const count = await service.reconcileStale(300_000);
      expect(count).toBe(0);
      expect(prisma.prisma.backupRun.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("heartbeat()", () => {
    it("returns cancelRequested and status when run exists", async () => {
      prisma.prisma.backupRun.update.mockResolvedValue({ cancelRequested: false, status: BackupRunStatus.Running });
      const result = await service.heartbeat("run-1");
      expect(result.cancelRequested).toBe(false);
      expect(result.status).toBe(BackupRunStatus.Running);
    });

    it("throws NotFoundException when the run does not exist", async () => {
      prisma.prisma.backupRun.update.mockRejectedValue(new Error("Record not found"));
      await expect(service.heartbeat("nope")).rejects.toThrow(NotFoundException);
    });
  });

  describe("upsertComponent()", () => {
    it("creates a new component row when none exists", async () => {
      prisma.prisma.backupComponent.findFirst.mockResolvedValue(null);
      await service.upsertComponent("run-1", {
        type: BackupComponentType.Volume,
        name: "vol-a",
        status: BackupComponentStatus.Running,
      });
      expect(prisma.prisma.backupComponent.create).toHaveBeenCalled();
      expect(publisher.publishRun).toHaveBeenCalledWith("run-1", Mutation.Updated);
    });

    it("creates a component row in terminal status with no startedAt", async () => {
      prisma.prisma.backupComponent.findFirst.mockResolvedValue(null);
      await service.upsertComponent("run-1", {
        type: BackupComponentType.Postgres,
        name: "svc-a",
        status: BackupComponentStatus.Skipped,
        bytes: 0,
        durationMs: 100,
        error: "skipped by policy",
      });
      expect(prisma.prisma.backupComponent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ startedAt: null, finishedAt: expect.any(Date) }),
        }),
      );
    });

    it("updates an existing component row", async () => {
      prisma.prisma.backupComponent.findFirst.mockResolvedValue({ id: "comp-1", startedAt: new Date() });
      await service.upsertComponent("run-1", {
        type: BackupComponentType.Volume,
        name: "vol-a",
        status: BackupComponentStatus.Success,
      });
      expect(prisma.prisma.backupComponent.update).toHaveBeenCalled();
    });

    it("sets startedAt when updating an existing row with null startedAt and Running status", async () => {
      prisma.prisma.backupComponent.findFirst.mockResolvedValue({ id: "comp-null", startedAt: null });
      await service.upsertComponent("run-1", {
        type: BackupComponentType.Volume,
        name: "vol-b",
        status: BackupComponentStatus.Running,
        bytes: 512,
        durationMs: 50,
        error: "some error",
      });
      expect(prisma.prisma.backupComponent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ startedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("upsertRunDestination()", () => {
    it("creates a new destination row when none exists", async () => {
      prisma.prisma.backupRunDestination.findFirst.mockResolvedValue(null);
      await service.upsertRunDestination("run-1", {
        destinationId: "dst-1",
        status: BackupComponentStatus.Running,
      });
      expect(prisma.prisma.backupRunDestination.create).toHaveBeenCalled();
    });

    it("creates destination in terminal status with finishedAt set", async () => {
      prisma.prisma.backupRunDestination.findFirst.mockResolvedValue(null);
      await service.upsertRunDestination("run-1", {
        destinationId: "dst-2",
        status: BackupComponentStatus.Failed,
        uploadedBytes: 0,
        error: "upload failed",
      });
      expect(prisma.prisma.backupRunDestination.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ finishedAt: expect.any(Date) }),
        }),
      );
    });

    it("updates an existing destination row", async () => {
      prisma.prisma.backupRunDestination.findFirst.mockResolvedValue({ id: "rd-1", startedAt: null });
      await service.upsertRunDestination("run-1", {
        destinationId: "dst-1",
        status: BackupComponentStatus.Success,
        finalPath: "/var/lib/backup/archives/run-1.tar.gz.age",
        uploadedBytes: 4096,
      });
      expect(prisma.prisma.backupRunDestination.update).toHaveBeenCalled();
    });

    it("sets startedAt on update when null and status is Running", async () => {
      prisma.prisma.backupRunDestination.findFirst.mockResolvedValue({ id: "rd-nostart", startedAt: null });
      await service.upsertRunDestination("run-1", {
        destinationId: "dst-3",
        status: BackupComponentStatus.Running,
      });
      expect(prisma.prisma.backupRunDestination.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ startedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("updateRunArchive()", () => {
    it("no-ops when the input has no fields", async () => {
      await service.updateRunArchive("run-1", {});
      expect(prisma.prisma.backupRun.update).not.toHaveBeenCalled();
    });

    it("updates the run with provided archive fields", async () => {
      prisma.prisma.backupRun.update.mockResolvedValue({});
      await service.updateRunArchive("run-1", { archivePath: "/path", archiveBytes: 512 });
      expect(prisma.prisma.backupRun.update).toHaveBeenCalled();
      expect(publisher.publishRun).toHaveBeenCalled();
    });

    it("updates with all optional archive fields set", async () => {
      prisma.prisma.backupRun.update.mockResolvedValue({});
      await service.updateRunArchive("run-1", {
        archivePath: "/var/lib/backup/archives/run-1.tar.gz.age",
        archiveBytes: 1024,
        archiveSha256: "deadbeef",
        keyFingerprint: "fp-xyz",
        manifest: { volumes: ["vol-a"] },
      });
      expect(prisma.prisma.backupRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            archiveSha256: "deadbeef",
            keyFingerprint: "fp-xyz",
            manifest: { volumes: ["vol-a"] },
          }),
        }),
      );
    });
  });

  describe("finalizeRun()", () => {
    it("sets status and finishedAt", async () => {
      prisma.prisma.backupRun.update.mockResolvedValue({});
      await service.finalizeRun("run-1", { status: BackupRunStatus.Success });
      expect(prisma.prisma.backupRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: BackupRunStatus.Success }),
        }),
      );
      expect(publisher.publishRun).toHaveBeenCalled();
    });

    it("includes all optional archive fields in finalize", async () => {
      prisma.prisma.backupRun.update.mockResolvedValue({});
      await service.finalizeRun("run-1", {
        status: BackupRunStatus.Failed,
        errorMessage: "out of disk",
        archivePath: "/var/lib/backup/archives/run-1.tar.gz.age",
        archiveBytes: 2048,
        archiveSha256: "cafebabe",
        keyFingerprint: "fp-abc",
        manifest: { services: [] },
      });
      expect(prisma.prisma.backupRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            errorMessage: "out of disk",
            archiveSha256: "cafebabe",
            keyFingerprint: "fp-abc",
          }),
        }),
      );
    });
  });

  describe("upsertKey()", () => {
    it("creates a new key and deactivates old ones", async () => {
      prisma.prisma.backupKey.findUnique.mockResolvedValue(null);
      prisma.prisma.backupKey.create.mockResolvedValue({ id: "key-new" });
      const result = await service.upsertKey({
        algorithm: BackupKeyAlgorithm.Age,
        publicKey: "age1abc",
        fingerprint: "fp-abc",
      });
      expect(result.created).toBe(true);
      expect(publisher.publishKey).toHaveBeenCalledWith("key-new", Mutation.Created);
    });

    it("updates an existing key without creating a new row", async () => {
      prisma.prisma.backupKey.findUnique.mockResolvedValue({ id: "key-existing" });
      prisma.prisma.backupKey.update.mockResolvedValue({ id: "key-existing" });
      const result = await service.upsertKey({
        algorithm: BackupKeyAlgorithm.Age,
        publicKey: "age1updated",
        fingerprint: "fp-existing",
      });
      expect(result.created).toBe(false);
      expect(publisher.publishKey).toHaveBeenCalledWith("key-existing", Mutation.Updated);
    });

    it("creates key with a privateKeyPath provided", async () => {
      prisma.prisma.backupKey.findUnique.mockResolvedValue(null);
      prisma.prisma.backupKey.create.mockResolvedValue({ id: "key-with-priv" });
      const result = await service.upsertKey({
        algorithm: BackupKeyAlgorithm.Age,
        publicKey: "age1abc",
        fingerprint: "fp-with-priv",
        privateKeyPath: "/run/secrets/backup_key",
      });
      expect(result.created).toBe(true);
      expect(prisma.prisma.backupKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ privateKeyPath: "/run/secrets/backup_key" }),
        }),
      );
    });

    it("updates existing key with a privateKeyPath provided", async () => {
      prisma.prisma.backupKey.findUnique.mockResolvedValue({ id: "key-upd-priv" });
      prisma.prisma.backupKey.update.mockResolvedValue({ id: "key-upd-priv" });
      await service.upsertKey({
        algorithm: BackupKeyAlgorithm.Age,
        publicKey: "age1abc",
        fingerprint: "fp-upd-priv",
        privateKeyPath: "/run/secrets/backup_key",
      });
      expect(prisma.prisma.backupKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ privateKeyPath: "/run/secrets/backup_key" }),
        }),
      );
    });
  });
});
