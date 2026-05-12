import { PrismaService } from "@/prisma/prisma.service";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression, SchedulerRegistry, Timeout } from "@nestjs/schedule";
import { CronJob } from "cron";
import { BackupComponentStatus, BackupRunStatus, BackupRunTrigger } from "@prisma/client";
import { BaseService } from "..";
import { AppConfigService } from "@/app.config";
import { BackupDiscoveryService } from "./backup-discovery.service";

/**
 * BackupService - orchestrates the scheduling side of the backup pipeline.
 *
 * Responsibilities:
 *   1. Read the single active `BackupPolicy` row and register a NestJS
 *      cron job that enqueues a `BackupRun` (status=Queued) whenever the
 *      cron expression fires.
 *   2. Re-register the cron job when the policy is mutated (poll-based so
 *      we do not need to couple to GraphQL subscriptions here).
 *   3. On startup, reconcile any runs left in `Running` from a previous
 *      process crash - any whose heartbeat is older than
 *      `STALE_HEARTBEAT_MS` are marked `Failed`.
 *
 * Retention is enforced at the destination level only (archive files are
 * pruned by destination-local.sh / destination-s3.sh during each upload).
 * BackupRun DB rows are retained indefinitely as an audit trail - the UI
 * surfaces per-destination availability so operators can see which runs
 * still have recoverable archives.
 *
 * Actual archive generation / upload is performed by the docker/backup
 * sidecar worker, which polls for Queued runs and executes `backup.sh`.
 * This service only touches the database.
 */
@Injectable()
export class BackupService extends BaseService implements OnModuleInit {
  private static readonly CRON_NAME = "backup-policy";
  private static readonly STALE_HEARTBEAT_MS = 5 * 60 * 1000;

  private logger = new Logger(BackupService.name);
  private activeCron: string | null = null;

  constructor(
    private prismaService: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
    @Inject(AppConfigService.Key) configService: AppConfigService,
    private backupDiscoveryService: BackupDiscoveryService,
  ) {
    super("backup", configService);
  }

  async onModuleInit() {
    await this.ensureDefaultPolicy().catch((err: Error) => {
      this.logger.warn({ message: err.message, stack: err.stack });
    });
    await this.recoverStaleRuns().catch((err: Error) => {
      this.logger.warn({ message: err.message, stack: err.stack });
    });
    await this.reloadPolicy().catch((err: Error) => {
      this.logger.warn({ message: err.message, stack: err.stack });
    });
  }

  /**
   * Create the singleton BackupPolicy row on first boot if it doesn't
   * exist. The policy starts with empty operator-chosen excludes;
   * auto-excluded resources (self-reference mounts, cache volumes,
   * repo-content bind paths, docker sockets) are enforced at claim
   * time by BackupWorkerService using live discovery. Not persisting
   * them keeps the stored policy in sync with the compose file over
   * time.
   */
  private async ensureDefaultPolicy(): Promise<void> {
    const existing = await this.prismaService.prisma.backupPolicy.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (existing) return;
    await this.prismaService.prisma.backupPolicy.create({
      data: { id: "default", enabled: false, cron: "0 2 * * *", retentionDays: 30 },
    });
  }

  /** Runs every minute to detect BackupPolicy changes and re-register the cron. */
  @Timeout(5000)
  @Cron(CronExpression.EVERY_MINUTE)
  async poll(): Promise<void> {
    await this.reloadPolicy().catch((err: Error) => {
      this.logger.warn({ message: err.message, stack: err.stack });
    });
  }

  /** Hourly retention sweep + stale-run recovery. */
  @Cron(CronExpression.EVERY_HOUR)
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    await this.recoverStaleRuns();
  }

  /**
   * Load the active policy and (re)register the cron job iff the
   * expression changed or the policy was disabled/re-enabled.
   */
  async reloadPolicy(): Promise<void> {
    const policy = await this.prismaService.prisma.backupPolicy.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!policy || !policy.enabled) {
      this.unregisterCron();
      return;
    }

    if (this.activeCron === policy.cron) {
      return;
    }

    this.unregisterCron();
    try {
      const job = new CronJob(policy.cron, () => {
        this.enqueueScheduledRun(policy.id).catch((err: Error) => {
          this.logger.error({ message: err.message, stack: err.stack }, "Failed to enqueue scheduled BackupRun");
        });
      });
      this.schedulerRegistry.addCronJob(BackupService.CRON_NAME, job);
      job.start();
      this.activeCron = policy.cron;
      this.logger.log(`Registered backup cron '${policy.cron}' for policy ${policy.id}`);
    } catch (err) {
      this.logger.error(
        { message: (err as Error).message, stack: (err as Error).stack },
        `Invalid cron expression '${policy.cron}' - backup scheduling disabled until fixed`,
      );
    }
  }

  private unregisterCron() {
    if (this.activeCron !== null) {
      try {
        this.schedulerRegistry.deleteCronJob(BackupService.CRON_NAME);
      } catch {
        // Already removed; ignore.
      }
      this.activeCron = null;
      this.logger.log("Unregistered backup cron");
    }
  }

  /**
   * Insert a Queued BackupRun for the sidecar worker to claim. Skipped if
   * another run is currently in flight to avoid overlapping backups.
   */
  private async enqueueScheduledRun(policyId: string): Promise<void> {
    const inflight = await this.prismaService.prisma.backupRun.count({
      where: { status: { in: [BackupRunStatus.Queued, BackupRunStatus.Running] } },
    });
    if (inflight > 0) {
      this.logger.warn(`Skipping scheduled backup; ${inflight} run(s) already in flight`);
      return;
    }
    const run = await this.prismaService.prisma.backupRun.create({
      data: {
        policyId,
        status: BackupRunStatus.Queued,
        trigger: BackupRunTrigger.Scheduled,
      },
    });
    this.logger.log(`Enqueued scheduled BackupRun ${run.id}`);
  }

  /**
   * Mark runs with stale heartbeats as Failed. A run is considered stale
   * when its last heartbeat is older than STALE_HEARTBEAT_MS, or when it
   * was left in Running with no heartbeat at all past that threshold
   * from `startedAt`.
   */
  private async recoverStaleRuns(): Promise<void> {
    const threshold = new Date(Date.now() - BackupService.STALE_HEARTBEAT_MS);
    const stale = await this.prismaService.prisma.backupRun.findMany({
      where: {
        status: BackupRunStatus.Running,
        OR: [{ heartbeatAt: { lt: threshold } }, { heartbeatAt: null, startedAt: { lt: threshold } }],
      },
      select: { id: true },
    });
    if (stale.length === 0) {
      return;
    }
    const ids = stale.map((r) => r.id);
    this.logger.warn(`Recovering ${stale.length} stale BackupRun(s) from previous crash`);
    await this.prismaService.prisma.$transaction([
      this.prismaService.prisma.backupRun.updateMany({
        where: { id: { in: ids } },
        data: {
          status: BackupRunStatus.Failed,
          errorMessage: "Run was abandoned (worker heartbeat timed out).",
          finishedAt: new Date(),
        },
      }),
      this.prismaService.prisma.backupComponent.updateMany({
        where: { runId: { in: ids }, status: BackupComponentStatus.Running },
        data: {
          status: BackupComponentStatus.Failed,
          error: "Worker abandoned this component.",
          finishedAt: new Date(),
        },
      }),
    ]);
  }

}
