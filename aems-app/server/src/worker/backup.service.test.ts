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

    it("updates an existing component row", async () => {
      prisma.prisma.backupComponent.findFirst.mockResolvedValue({ id: "comp-1", startedAt: new Date() });
      await service.upsertComponent("run-1", {
        type: BackupComponentType.Volume,
        name: "vol-a",
        status: BackupComponentStatus.Success,
      });
      expect(prisma.prisma.backupComponent.update).toHaveBeenCalled();
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
  });
});
