import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { BackupComponentStatus, BackupComponentType, BackupKeyAlgorithm, BackupRunStatus } from "@prisma/client";
import { BackupWorkerService, ClaimResult } from "./backup.service";
import { WorkerTokenGuard } from "./token.guard";

/**
 * Internal REST API for the backup sidecar.
 *
 * Deliberately not prefixed with /api — the Traefik server router at
 * docker/docker-compose.yml only routes the allow-listed prefixes
 * (/authjs, /graphql, /api, /ext). /worker is invisible externally; the
 * sidecar reaches us via the compose-internal hostname `server`.
 *
 * All handlers are additionally guarded by WorkerTokenGuard, which
 * rejects any request missing the shared X-Worker-Token header.
 */
@Controller("worker/backup")
@UseGuards(WorkerTokenGuard)
export class BackupWorkerController {
  private readonly logger = new Logger(BackupWorkerController.name);

  constructor(private readonly workerService: BackupWorkerService) {}

  @Post("runs/claim")
  @HttpCode(HttpStatus.OK)
  async claim(): Promise<ClaimResult | { claimed: false }> {
    const result = await this.workerService.claimNextRun();
    return result ?? { claimed: false };
  }

  @Post("runs/reconcile-stale")
  @HttpCode(HttpStatus.OK)
  async reconcileStale(@Body() body: { staleMs: number }): Promise<{ reconciled: number }> {
    const staleMs = Number(body?.staleMs);
    if (!Number.isFinite(staleMs) || staleMs <= 0) {
      return { reconciled: 0 };
    }
    const reconciled = await this.workerService.reconcileStale(staleMs);
    return { reconciled };
  }

  @Post("runs/:id/heartbeat")
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Param("id") id: string): Promise<{ cancelRequested: boolean; status: BackupRunStatus }> {
    return this.workerService.heartbeat(id);
  }

  @Post("runs/:id/components")
  @HttpCode(HttpStatus.NO_CONTENT)
  async component(
    @Param("id") id: string,
    @Body()
    body: {
      type: BackupComponentType;
      name: string;
      status: BackupComponentStatus;
      bytes?: number | null;
      durationMs?: number | null;
      error?: string | null;
    },
  ): Promise<void> {
    await this.workerService.upsertComponent(id, body);
  }

  @Post("runs/:id/destinations")
  @HttpCode(HttpStatus.NO_CONTENT)
  async destination(
    @Param("id") id: string,
    @Body()
    body: {
      destinationId: string;
      status: BackupComponentStatus;
      uploadedBytes?: number | null;
      finalPath?: string | null;
      error?: string | null;
    },
  ): Promise<void> {
    await this.workerService.upsertRunDestination(id, body);
  }

  @Post("runs/:id/archive")
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(
    @Param("id") id: string,
    @Body()
    body: {
      archivePath?: string | null;
      archiveBytes?: number | null;
      archiveSha256?: string | null;
      keyFingerprint?: string | null;
      manifest?: unknown;
    },
  ): Promise<void> {
    await this.workerService.updateRunArchive(id, body);
  }

  @Post("runs/:id/finalize")
  @HttpCode(HttpStatus.OK)
  async finalize(
    @Param("id") id: string,
    @Body()
    body: {
      status: BackupRunStatus;
      errorMessage?: string | null;
      archivePath?: string | null;
      archiveBytes?: number | null;
      archiveSha256?: string | null;
      keyFingerprint?: string | null;
      manifest?: unknown;
    },
  ): Promise<{ ok: true }> {
    await this.workerService.finalizeRun(id, body);
    return { ok: true };
  }

  @Post("keys/upsert")
  @HttpCode(HttpStatus.OK)
  async upsertKey(
    @Body()
    body: {
      algorithm: BackupKeyAlgorithm;
      publicKey: string;
      fingerprint: string;
      privateKeyPath?: string | null;
    },
  ): Promise<{ id: string; created: boolean; active: boolean }> {
    return this.workerService.upsertKey(body);
  }
}
