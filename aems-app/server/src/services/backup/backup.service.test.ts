import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { BackupService } from "./backup.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { BackupDiscoveryService } from "./backup-discovery.service";

function makeConfig(overrides: object = {}): AppConfigService {
  return {
    instanceType: "backup",
    service: { backup: { workspace: null, composeProfiles: [] } },
    ...overrides,
  } as unknown as AppConfigService;
}

function makePrisma() {
  return {
    prisma: {
      backupPolicy: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      backupRun: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: "run-1" }),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      backupComponent: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
    },
  };
}

function makeScheduler() {
  return {
    addCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
    hasCronJob: jest.fn().mockReturnValue(false),
  } as unknown as jest.Mocked<SchedulerRegistry>;
}

function makeDiscovery(): jest.Mocked<BackupDiscoveryService> {
  return {
    discover: jest.fn().mockResolvedValue({ services: [], volumes: [], paths: [], envFiles: [] }),
  } as unknown as jest.Mocked<BackupDiscoveryService>;
}

describe("BackupService", () => {
  let module: TestingModule;
  let service: BackupService;
  let mockPrisma: ReturnType<typeof makePrisma>;
  let mockScheduler: jest.Mocked<SchedulerRegistry>;
  let mockDiscovery: jest.Mocked<BackupDiscoveryService>;

  beforeEach(async () => {
    mockPrisma = makePrisma();
    mockScheduler = makeScheduler();
    mockDiscovery = makeDiscovery();

    module = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AppConfigService.Key, useValue: makeConfig() },
        { provide: SchedulerRegistry, useValue: mockScheduler },
        { provide: BackupDiscoveryService, useValue: mockDiscovery },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("constructs without throwing", () => {
    expect(service).toBeInstanceOf(BackupService);
  });

  describe("reloadPolicy()", () => {
    it("does nothing when no policy exists", async () => {
      mockPrisma.prisma.backupPolicy.findFirst.mockResolvedValue(null);
      await service.reloadPolicy();
      expect(mockScheduler.addCronJob).not.toHaveBeenCalled();
    });

    it("does nothing when policy is disabled", async () => {
      mockPrisma.prisma.backupPolicy.findFirst.mockResolvedValue({ id: "pol", enabled: false, cron: "0 2 * * *" });
      await service.reloadPolicy();
      expect(mockScheduler.addCronJob).not.toHaveBeenCalled();
    });

    it("registers a cron job when policy is enabled with a new expression", async () => {
      mockPrisma.prisma.backupPolicy.findFirst.mockResolvedValue({ id: "pol", enabled: true, cron: "0 2 * * *" });
      await service.reloadPolicy();
      expect(mockScheduler.addCronJob).toHaveBeenCalledWith("backup-policy", expect.any(Object));
    });

    it("skips re-registering when the expression matches the active cron", async () => {
      mockPrisma.prisma.backupPolicy.findFirst.mockResolvedValue({ id: "pol", enabled: true, cron: "0 2 * * *" });
      await service.reloadPolicy(); // first call registers
      jest.clearAllMocks();
      await service.reloadPolicy(); // second call — same cron, no-op
      expect(mockScheduler.addCronJob).not.toHaveBeenCalled();
    });

    it("logs an error and does not register for an invalid cron expression", async () => {
      const errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(jest.fn());
      mockPrisma.prisma.backupPolicy.findFirst.mockResolvedValue({ id: "pol", enabled: true, cron: "not-a-cron" });
      await expect(service.reloadPolicy()).resolves.toBeUndefined();
      expect(mockScheduler.addCronJob).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
        expect.stringContaining("not-a-cron"),
      );
      errorSpy.mockRestore();
    });
  });

  describe("task() — recoverStaleRuns", () => {
    it("does nothing when there are no stale runs", async () => {
      mockPrisma.prisma.backupRun.findMany.mockResolvedValue([]);
      await service.task();
      expect(mockPrisma.prisma.backupRun.updateMany).not.toHaveBeenCalled();
    });

    it("marks stale Running runs as Failed via a transaction", async () => {
      mockPrisma.prisma.backupRun.findMany.mockResolvedValue([{ id: "run-stale" }]);
      await service.task();
      expect(mockPrisma.prisma.$transaction).toHaveBeenCalled();
    });
  });
});
