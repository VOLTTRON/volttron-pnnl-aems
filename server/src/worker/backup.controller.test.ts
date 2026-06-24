import { BackupWorkerController } from "./backup.controller";
import { BackupWorkerService } from "./backup.service";
import { BackupComponentStatus, BackupComponentType, BackupKeyAlgorithm, BackupRunStatus } from "@prisma/client";

function makeService(): jest.Mocked<BackupWorkerService> {
  return {
    claimNextRun: jest.fn(),
    reconcileStale: jest.fn(),
    heartbeat: jest.fn(),
    upsertComponent: jest.fn().mockResolvedValue(undefined),
    upsertRunDestination: jest.fn().mockResolvedValue(undefined),
    updateRunArchive: jest.fn().mockResolvedValue(undefined),
    finalizeRun: jest.fn().mockResolvedValue(undefined),
    upsertKey: jest.fn(),
  } as unknown as jest.Mocked<BackupWorkerService>;
}

describe("BackupWorkerController", () => {
  let controller: BackupWorkerController;
  let workerService: jest.Mocked<BackupWorkerService>;

  beforeEach(() => {
    workerService = makeService();
    controller = new BackupWorkerController(workerService);
  });

  describe("claim()", () => {
    it("returns ClaimResult when a run is available", async () => {
      const claimResult = {
        run: { id: "run-1", policyId: "pol-1", trigger: "Scheduled", cancelRequested: false },
        policy: { id: "pol-1", enabled: true, cron: "0 2 * * *", retentionDays: 30, excludeVolumes: [], excludePaths: [], excludeServices: [], excludeEnvFiles: [], extraEnvFiles: [], includeDatabases: [] },
        destinations: [],
        activeKeyFingerprint: null,
      };
      workerService.claimNextRun.mockResolvedValue(claimResult);
      const result = await controller.claim();
      expect(result).toEqual(claimResult);
    });

    it("returns { claimed: false } when no run is available", async () => {
      workerService.claimNextRun.mockResolvedValue(null);
      const result = await controller.claim();
      expect(result).toEqual({ claimed: false });
    });
  });

  describe("reconcileStale()", () => {
    it("forwards staleMs to the service and returns reconciled count", async () => {
      workerService.reconcileStale.mockResolvedValue(3);
      const result = await controller.reconcileStale({ staleMs: 300_000 });
      expect(result).toEqual({ reconciled: 3 });
      expect(workerService.reconcileStale).toHaveBeenCalledWith(300_000);
    });

    it("returns { reconciled: 0 } for non-finite staleMs", async () => {
      const result = await controller.reconcileStale({ staleMs: NaN });
      expect(result).toEqual({ reconciled: 0 });
      expect(workerService.reconcileStale).not.toHaveBeenCalled();
    });

    it("returns { reconciled: 0 } for negative staleMs", async () => {
      const result = await controller.reconcileStale({ staleMs: -1 });
      expect(result).toEqual({ reconciled: 0 });
    });
  });

  describe("heartbeat()", () => {
    it("forwards run id and returns status", async () => {
      workerService.heartbeat.mockResolvedValue({ cancelRequested: false, status: BackupRunStatus.Running });
      const result = await controller.heartbeat("run-1");
      expect(result.cancelRequested).toBe(false);
      expect(workerService.heartbeat).toHaveBeenCalledWith("run-1");
    });
  });

  describe("component()", () => {
    it("calls upsertComponent with the provided body", async () => {
      await controller.component("run-1", {
        type: BackupComponentType.Volume,
        name: "vol-a",
        status: BackupComponentStatus.Running,
      });
      expect(workerService.upsertComponent).toHaveBeenCalledWith("run-1", expect.objectContaining({ name: "vol-a" }));
    });
  });

  describe("destination()", () => {
    it("calls upsertRunDestination with the provided body", async () => {
      await controller.destination("run-1", {
        destinationId: "dst-1",
        status: BackupComponentStatus.Success,
      });
      expect(workerService.upsertRunDestination).toHaveBeenCalledWith("run-1", expect.objectContaining({ destinationId: "dst-1" }));
    });
  });

  describe("archive()", () => {
    it("calls updateRunArchive with the provided body", async () => {
      await controller.archive("run-1", { archivePath: "/path/run-1.tar.gz.age" });
      expect(workerService.updateRunArchive).toHaveBeenCalledWith("run-1", expect.objectContaining({ archivePath: "/path/run-1.tar.gz.age" }));
    });
  });

  describe("finalize()", () => {
    it("calls finalizeRun and returns { ok: true }", async () => {
      const result = await controller.finalize("run-1", { status: BackupRunStatus.Success });
      expect(result).toEqual({ ok: true });
      expect(workerService.finalizeRun).toHaveBeenCalledWith("run-1", expect.objectContaining({ status: BackupRunStatus.Success }));
    });
  });

  describe("upsertKey()", () => {
    it("delegates to workerService.upsertKey", async () => {
      workerService.upsertKey.mockResolvedValue({ id: "key-1", created: true, active: true });
      const result = await controller.upsertKey({
        algorithm: BackupKeyAlgorithm.Age,
        publicKey: "age1xyz",
        fingerprint: "fp-xyz",
      });
      expect(result).toEqual({ id: "key-1", created: true, active: true });
    });
  });
});
