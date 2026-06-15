import * as fs from "fs/promises";
import * as path from "path";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  BackupComponentStatus,
  BackupComponentType,
  BackupDestinationType,
  BackupKeyAlgorithm,
  BackupRunStatus,
} from "@prisma/client";
import { Mutation } from "@local/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BackupSubscriptionPublisher } from "@/services/backup/backup-publisher.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";

/**
 * Directory the sidecar writes Local-destination archives into, mounted
 * into this container at the same path (./backups → /var/lib/backup/archives
 * in docker/docker-compose.yml). Archives are named `<runId>.tar.gz.<ext>`
 * where <ext> is "age" or "gpg". That filename convention is what lets
 * reconciliation map an orphaned archive back to its BackupRun row.
 */
const LOCAL_ARCHIVE_DIR = "/var/lib/backup/archives";

export interface ClaimResult {
  run: {
    id: string;
    policyId: string;
    trigger: string;
    cancelRequested: boolean;
  };
  policy: {
    id: string;
    enabled: boolean;
    cron: string | null;
    retentionDays: number;
    excludeVolumes: string[];
    excludePaths: string[];
    excludeServices: string[];
    excludeEnvFiles: string[];
    extraEnvFiles: string[];
    // Authoritative "service:engine" hints for DB dumps. The shell worker's
    // discover.sh classifies DB services by image-name substring, which
    // misses custom builds whose tag doesn't contain "postgres"/"mariadb"
    // (our own `database` service is PostGIS built locally). The server's
    // BackupDiscoveryService falls back to the Dockerfile's last FROM line
    // and gets the right answer; this field carries that answer down to
    // the worker.
    includeDatabases: string[];
  };
  destinations: Array<{
    id: string;
    name: string;
    type: string;
    output: string | null;
    enabled: boolean;
    sseMode: string | null;
    sseKmsKeyId: string | null;
    order: number;
  }>;
  activeKeyFingerprint: string | null;
}

interface ComponentUpsertInput {
  type: BackupComponentType;
  name: string;
  status: BackupComponentStatus;
  bytes?: number | null;
  durationMs?: number | null;
  error?: string | null;
}

interface DestinationUpsertInput {
  destinationId: string;
  status: BackupComponentStatus;
  uploadedBytes?: number | null;
  finalPath?: string | null;
  error?: string | null;
}

interface ArchiveUpdateInput {
  archivePath?: string | null;
  archiveBytes?: number | null;
  archiveSha256?: string | null;
  keyFingerprint?: string | null;
  manifest?: unknown;
}

interface FinalizeInput extends ArchiveUpdateInput {
  status: BackupRunStatus;
  errorMessage?: string | null;
}

interface KeyUpsertInput {
  algorithm: BackupKeyAlgorithm;
  publicKey: string;
  fingerprint: string;
  privateKeyPath?: string | null;
}

/**
 * All Prisma writes the backup sidecar used to do with raw pg now route
 * through here. Every mutating method that touches a BackupRun or
 * BackupKey also publishes through BackupSubscriptionPublisher so the UI
 * gets live updates.
 */
@Injectable()
export class BackupWorkerService {
  private readonly logger = new Logger(BackupWorkerService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly publisher: BackupSubscriptionPublisher,
    private readonly discoveryService: BackupDiscoveryService,
  ) {}

  private get prisma() {
    return this.prismaService.prisma;
  }

  /**
   * Atomic SKIP LOCKED claim of the oldest Queued run. Returns null when
   * there's nothing to claim. When a row is claimed it is flipped to
   * Running and its timestamps initialized; the caller gets everything it
   * needs for the run (policy, enabled destinations, active key) in the
   * same response so no additional round trips are required.
   */
  async claimNextRun(): Promise<ClaimResult | null> {
    // keyFingerprint is stamped here (not only at archive/finalize time) so
    // that if the DB dump captures this run mid-flight — an unavoidable
    // consequence of a backup dumping itself — the restored row still
    // carries the fingerprint instead of coming back as null.
    const claimed = await this.prisma.$queryRaw<
      Array<{ id: string; policyId: string; trigger: string; cancelRequested: boolean }>
    >`
      UPDATE "BackupRun"
         SET status = 'Running',
             "startedAt" = NOW(),
             "heartbeatAt" = NOW(),
             "updatedAt" = NOW(),
             "keyFingerprint" = (
               SELECT fingerprint FROM "BackupKey"
                WHERE active = true
                ORDER BY "createdAt" DESC
                LIMIT 1
             )
       WHERE id = (
         SELECT id FROM "BackupRun"
          WHERE status = 'Queued'
          ORDER BY "createdAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
       )
      RETURNING id, "policyId", trigger::text, "cancelRequested"
    `;

    const row = claimed[0];
    if (!row) return null;

    await this.publisher.publishRun(row.id, Mutation.Updated);

    const policy = await this.prisma.backupPolicy.findUniqueOrThrow({ where: { id: row.policyId } });
    const destinations = await this.prisma.backupDestination.findMany({
      where: { policyId: row.policyId, enabled: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    const activeKey = await this.prisma.backupKey.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    // Every resource the discovery service flags as auto-excluded (self-
    // reference mounts, the workspace root, cache-named volumes, bind
    // paths that are repo content, docker sockets) is added to the
    // effective excludes regardless of what the stored policy has. The
    // UI shows "auto-excluded" tags for the same set; enforcing here
    // makes the promise real without requiring every install to re-seed.
    let autoExcludeVolumes: string[] = [];
    let autoExcludePaths: string[] = [];
    let includeDatabases: string[] = [];
    try {
      const discovery = await this.discoveryService.discover();
      autoExcludeVolumes = discovery.volumes.filter((v) => v.autoExclude).map((v) => v.name);
      autoExcludePaths = discovery.paths.filter((p) => p.autoExclude).map((p) => p.path);
      includeDatabases = discovery.services
        .filter((s) => s.backupStrategy !== null && !policy.excludeServices.includes(s.name))
        .map((s) => `${s.name}:${(s.engine ?? "").toLowerCase()}`)
        .filter((s) => !s.endsWith(":"));
    } catch (e) {
      this.logger.warn(
        `Discovery failed during claim; auto-exclude skipped: ${(e as Error).message}`,
      );
    }
    const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

    return {
      run: {
        id: row.id,
        policyId: row.policyId,
        trigger: row.trigger,
        cancelRequested: row.cancelRequested,
      },
      policy: {
        id: policy.id,
        enabled: policy.enabled,
        cron: policy.cron,
        retentionDays: policy.retentionDays,
        excludeVolumes: union(policy.excludeVolumes, autoExcludeVolumes),
        excludePaths: union(policy.excludePaths, autoExcludePaths),
        // Services are operator-chosen only — services with a known
        // backup strategy default to selected (dump runs). No auto-
        // exclude union here; the UI does not mark them auto-excluded.
        excludeServices: policy.excludeServices,
        excludeEnvFiles: policy.excludeEnvFiles,
        extraEnvFiles: policy.extraEnvFiles,
        includeDatabases,
      },
      destinations: destinations.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        output: d.output,
        enabled: d.enabled,
        sseMode: d.sseMode,
        sseKmsKeyId: d.sseKmsKeyId,
        order: d.order,
      })),
      activeKeyFingerprint: activeKey?.fingerprint ?? null,
    };
  }

  /**
   * Probe the shared local archive directory for `<runId>.tar.gz.age|gpg`
   * and return its path + size if found. The server and sidecar mount the
   * same host directory at the same path (see docker/docker-compose.yml),
   * so a file written by the sidecar is visible here.
   */
  private async findLocalArchive(
    runId: string,
  ): Promise<{ archivePath: string; archiveBytes: number } | null> {
    for (const ext of ["age", "gpg"] as const) {
      const candidate = path.join(LOCAL_ARCHIVE_DIR, `${runId}.tar.gz.${ext}`);
      try {
        const stat = await fs.stat(candidate);
        if (stat.isFile()) {
          return { archivePath: candidate, archiveBytes: Number(stat.size) };
        }
      } catch {
        // ENOENT (or any stat error) -> try next extension.
      }
    }
    return null;
  }

  /**
   * Reconcile runs whose worker stopped updating them. Two cases:
   *
   *   1. Honest crash: the run was Running, no archive was ever written,
   *      heartbeat went stale. Mark Failed.
   *   2. Self-referential dump: a backup dumps the database *while it is
   *      still Running*, so the restored row comes back as
   *      `status=Running, keyFingerprint=null, archivePath=null` even
   *      though the archive on disk completed successfully. This pass
   *      also sweeps rows previously mis-reconciled to Failed under the
   *      same signature. If `<runId>.tar.gz.<ext>` exists in the shared
   *      local archive directory, mark the run Success and backfill
   *      archive/destination metadata so it displays as Available.
   *
   * Called by the sidecar at boot so a crashed worker doesn't wedge the
   * queue, and opportunistically recovers rows that a prior reconcile
   * (or the hourly BackupService.recoverStaleRuns sweep) already marked
   * Failed. Runs that were legitimately Failed with no archive on disk
   * are left alone — the inventory check is the discriminator.
   */
  async reconcileStale(staleMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - staleMs);
    const candidates = await this.prisma.backupRun.findMany({
      where: {
        OR: [
          {
            status: BackupRunStatus.Running,
            OR: [{ heartbeatAt: null }, { heartbeatAt: { lt: cutoff } }],
          },
          // Retroactive recovery: a restored self-referential-dump row
          // with no archive metadata at all. If its archive is still on
          // disk, we'll flip it Success below; otherwise it's skipped.
          {
            status: BackupRunStatus.Failed,
            keyFingerprint: null,
            archivePath: null,
            archiveSha256: null,
          },
        ],
      },
      select: { id: true, policyId: true, status: true },
    });
    if (candidates.length === 0) return 0;

    const recovered: string[] = [];
    const toFail: string[] = [];

    for (const run of candidates) {
      const found = await this.findLocalArchive(run.id);
      if (found) {
        await this.recoverRun(run.id, run.policyId, found);
        recovered.push(run.id);
      } else if (run.status === BackupRunStatus.Running) {
        toFail.push(run.id);
      }
      // Failed+null with no archive on disk: leave alone.
    }

    if (toFail.length > 0) {
      await this.prisma.backupRun.updateMany({
        where: { id: { in: toFail } },
        data: {
          status: BackupRunStatus.Failed,
          errorMessage: "Worker crashed or was restarted mid-run (no heartbeat).",
          finishedAt: new Date(),
        },
      });
      for (const id of toFail) {
        await this.publisher.publishRun(id, Mutation.Updated);
      }
    }

    if (recovered.length > 0) {
      this.logger.log(
        `Reconciled ${candidates.length} run(s): ${recovered.length} recovered as Success from on-disk archive, ${toFail.length} marked Failed.`,
      );
    } else if (toFail.length > 0) {
      this.logger.log(`Reconciled ${toFail.length} stale Running run(s) to Failed.`);
    }
    return toFail.length + recovered.length;
  }

  /**
   * Mark `runId` as Success and backfill archive/destination metadata
   * from the on-disk file. Used by reconcileStale when an archive is
   * found for a run that had been captured mid-flight in its own dump.
   *
   * `keyFingerprint` is filled from the currently-active BackupKey — we
   * can't recover the fingerprint that was actually used at encryption
   * time from the file alone. In the common no-rotation case this is the
   * same key; after a rotation it's a best effort so the UI stops
   * showing null.
   */
  private async recoverRun(
    runId: string,
    policyId: string,
    archive: { archivePath: string; archiveBytes: number },
  ): Promise<void> {
    const activeKey = await this.prisma.backupKey.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: { fingerprint: true },
    });

    await this.prisma.backupRun.update({
      where: { id: runId },
      data: {
        status: BackupRunStatus.Success,
        errorMessage: null,
        finishedAt: new Date(),
        archivePath: archive.archivePath,
        archiveBytes: BigInt(archive.archiveBytes),
        ...(activeKey?.fingerprint ? { keyFingerprint: activeKey.fingerprint } : {}),
      },
    });

    // Backfill a BackupRunDestination row for each enabled Local destination
    // so the Runs table can resolve archiveAvailability = Available instead
    // of Missing (getRunAvailability requires at least one destination
    // with a finalPath that exists on disk).
    const localDestinations = await this.prisma.backupDestination.findMany({
      where: { policyId, enabled: true, type: BackupDestinationType.Local },
      select: { id: true },
    });
    for (const dest of localDestinations) {
      const existing = await this.prisma.backupRunDestination.findFirst({
        where: { runId, destinationId: dest.id },
        select: { id: true },
      });
      if (existing) continue;
      await this.prisma.backupRunDestination.create({
        data: {
          runId,
          destinationId: dest.id,
          status: BackupComponentStatus.Success,
          finalPath: archive.archivePath,
          uploadedBytes: BigInt(archive.archiveBytes),
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });
    }

    await this.publisher.publishRun(runId, Mutation.Updated);
  }

  /**
   * Bump heartbeatAt and surface cancelRequested so the worker can fold
   * cancel polling into its heartbeat loop (one round trip instead of two).
   */
  async heartbeat(runId: string): Promise<{ cancelRequested: boolean; status: BackupRunStatus }> {
    try {
      const run = await this.prisma.backupRun.update({
        where: { id: runId },
        data: { heartbeatAt: new Date() },
        select: { cancelRequested: true, status: true },
      });
      return run;
    } catch {
      throw new NotFoundException(`BackupRun ${runId} not found`);
    }
  }

  async upsertComponent(runId: string, input: ComponentUpsertInput): Promise<void> {
    const existing = await this.prisma.backupComponent.findFirst({
      where: { runId, type: input.type, name: input.name },
      select: { id: true, startedAt: true },
    });
    const isRunning = input.status === BackupComponentStatus.Running;
    const isTerminal = (
      [BackupComponentStatus.Success, BackupComponentStatus.Failed, BackupComponentStatus.Skipped] as const
    ).includes(input.status as typeof BackupComponentStatus.Success);

    const bytesValue = input.bytes != null ? BigInt(input.bytes) : undefined;

    if (!existing) {
      await this.prisma.backupComponent.create({
        data: {
          runId,
          type: input.type,
          name: input.name,
          status: input.status,
          bytes: bytesValue ?? null,
          durationMs: input.durationMs ?? null,
          error: input.error ?? null,
          startedAt: isRunning ? new Date() : null,
          finishedAt: isTerminal ? new Date() : null,
        },
      });
    } else {
      await this.prisma.backupComponent.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          ...(bytesValue !== undefined ? { bytes: bytesValue } : {}),
          ...(input.durationMs != null ? { durationMs: input.durationMs } : {}),
          ...(input.error != null ? { error: input.error } : {}),
          ...(existing.startedAt == null && isRunning ? { startedAt: new Date() } : {}),
          ...(isTerminal ? { finishedAt: new Date() } : {}),
        },
      });
    }
    await this.publisher.publishRun(runId, Mutation.Updated);
  }

  async upsertRunDestination(runId: string, input: DestinationUpsertInput): Promise<void> {
    const existing = await this.prisma.backupRunDestination.findFirst({
      where: { runId, destinationId: input.destinationId },
      select: { id: true, startedAt: true },
    });
    const isRunning = input.status === BackupComponentStatus.Running;
    const isTerminal = (
      [BackupComponentStatus.Success, BackupComponentStatus.Failed, BackupComponentStatus.Skipped] as const
    ).includes(input.status as typeof BackupComponentStatus.Success);

    const uploadedValue = input.uploadedBytes != null ? BigInt(input.uploadedBytes) : undefined;

    if (!existing) {
      await this.prisma.backupRunDestination.create({
        data: {
          runId,
          destinationId: input.destinationId,
          status: input.status,
          uploadedBytes: uploadedValue ?? null,
          finalPath: input.finalPath ?? null,
          error: input.error ?? null,
          startedAt: isRunning ? new Date() : null,
          finishedAt: isTerminal ? new Date() : null,
        },
      });
    } else {
      await this.prisma.backupRunDestination.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          ...(uploadedValue !== undefined ? { uploadedBytes: uploadedValue } : {}),
          ...(input.finalPath != null ? { finalPath: input.finalPath } : {}),
          ...(input.error != null ? { error: input.error } : {}),
          ...(existing.startedAt == null && isRunning ? { startedAt: new Date() } : {}),
          ...(isTerminal ? { finishedAt: new Date() } : {}),
        },
      });
    }
    await this.publisher.publishRun(runId, Mutation.Updated);
  }

  async updateRunArchive(runId: string, input: ArchiveUpdateInput): Promise<void> {
    const data: Record<string, unknown> = {};
    if (input.archivePath != null) data.archivePath = input.archivePath;
    if (input.archiveBytes != null) data.archiveBytes = BigInt(input.archiveBytes);
    if (input.archiveSha256 != null) data.archiveSha256 = input.archiveSha256;
    if (input.keyFingerprint != null) data.keyFingerprint = input.keyFingerprint;
    if (input.manifest !== undefined) data.manifest = input.manifest as never;
    if (Object.keys(data).length === 0) return;

    await this.prisma.backupRun.update({ where: { id: runId }, data: data as never });
    await this.publisher.publishRun(runId, Mutation.Updated);
  }

  async finalizeRun(runId: string, input: FinalizeInput): Promise<void> {
    const data: Record<string, unknown> = {
      status: input.status,
      finishedAt: new Date(),
      heartbeatAt: new Date(),
    };
    if (input.errorMessage != null) data.errorMessage = input.errorMessage;
    if (input.archivePath != null) data.archivePath = input.archivePath;
    if (input.archiveBytes != null) data.archiveBytes = BigInt(input.archiveBytes);
    if (input.archiveSha256 != null) data.archiveSha256 = input.archiveSha256;
    if (input.keyFingerprint != null) data.keyFingerprint = input.keyFingerprint;
    if (input.manifest !== undefined) data.manifest = input.manifest as never;

    await this.prisma.backupRun.update({ where: { id: runId }, data: data as never });
    await this.publisher.publishRun(runId, Mutation.Updated);
  }

  /**
   * Upsert a BackupKey row by fingerprint. The row matching `fingerprint`
   * becomes the active key; every other row is marked inactive. Returns
   * whether this call created a new row (caller can use that to decide
   * whether to also archive an old on-disk keypair).
   */
  async upsertKey(input: KeyUpsertInput): Promise<{ id: string; created: boolean; active: boolean }> {
    const existing = await this.prisma.backupKey.findUnique({ where: { fingerprint: input.fingerprint } });
    if (existing) {
      const updated = await this.prisma.backupKey.update({
        where: { id: existing.id },
        data: {
          active: true,
          algorithm: input.algorithm,
          publicKey: input.publicKey,
          ...(input.privateKeyPath != null ? { privateKeyPath: input.privateKeyPath } : {}),
        },
      });
      await this.prisma.backupKey.updateMany({
        where: { id: { not: updated.id }, active: true },
        data: { active: false, rotatedAt: new Date() },
      });
      await this.publisher.publishKey(updated.id, Mutation.Updated);
      return { id: updated.id, created: false, active: true };
    }

    const created = await this.prisma.backupKey.create({
      data: {
        algorithm: input.algorithm,
        publicKey: input.publicKey,
        fingerprint: input.fingerprint,
        privateKeyPath: input.privateKeyPath ?? null,
        active: true,
        acknowledged: false,
      },
    });
    await this.prisma.backupKey.updateMany({
      where: { id: { not: created.id }, active: true },
      data: { active: false, rotatedAt: new Date() },
    });
    await this.publisher.publishKey(created.id, Mutation.Created);
    return { id: created.id, created: true, active: true };
  }
}
