import { PrismaService } from "@/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { BackupDestinationType, BackupRunDestination } from "@prisma/client";
import * as fs from "fs/promises";
import * as path from "path";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  NotFound,
  NoSuchKey,
  S3Client,
} from "@aws-sdk/client-s3";
import { Mutation } from "@local/common";
import { BackupSubscriptionPublisher } from "./backup-publisher.service";

/**
 * Tri-state availability of a single destination's archive. Distinct from
 * BackupComponentStatus (which describes upload progress) — this is about
 * whether the finalised archive still exists on disk / S3 right now.
 */
export type BackupArchiveAvailability = "Available" | "Missing" | "Removed";

export const BackupArchiveAvailabilityValues = ["Available", "Missing", "Removed"] as const;

/**
 * BackupArchiveService - read/delete operations on finalised archive
 * files at their destinations.
 *
 * The BackupRun row is the audit record; retention is archive-only (the
 * destination scripts age files off on upload). This service answers
 * "does the archive still exist?" (Available / Missing / Removed) and
 * lets operators delete archives on demand while keeping the DB row
 * intact. Intentional deletions flip `archiveDeletedAt` so the UI can
 * distinguish them from files that vanished on their own.
 */
@Injectable()
export class BackupArchiveService {
  private readonly logger = new Logger(BackupArchiveService.name);
  private s3ClientInstance: S3Client | null = null;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly publisher: BackupSubscriptionPublisher,
  ) {}

  private get s3Client(): S3Client {
    if (!this.s3ClientInstance) {
      this.s3ClientInstance = new S3Client({});
    }
    return this.s3ClientInstance;
  }

  /**
   * Parse an `s3://bucket/prefix/` URI into its parts. Prefix may be empty.
   */
  private parseS3Uri(uri: string | null | undefined): { bucket: string; prefix: string } | null {
    if (!uri) return null;
    const match = /^s3:\/\/([^/]+)(?:\/(.*))?$/.exec(uri.trim());
    if (!match) return null;
    const [, bucket, prefix] = match;
    return { bucket, prefix: prefix ?? "" };
  }

  /** Join an S3 prefix (possibly empty or trailing-slashed) with a basename. */
  private s3Key(prefix: string, finalPath: string): string {
    const base = path.posix.basename(finalPath);
    if (!prefix) return base;
    return prefix.endsWith("/") ? `${prefix}${base}` : `${prefix}/${base}`;
  }

  private isMissingError(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const maybe = err as { code?: string; name?: string; $metadata?: { httpStatusCode?: number } };
    if (maybe.code === "ENOENT") return true;
    if (maybe.$metadata?.httpStatusCode === 404) return true;
    if (maybe.name === "NotFound" || maybe.name === "NoSuchKey") return true;
    if (err instanceof NotFound || err instanceof NoSuchKey) return true;
    return false;
  }

  /**
   * Return the current availability of a single destination's archive.
   * `archiveDeletedAt` is authoritative: once set, availability is always
   * `Removed` without a disk/S3 probe. Otherwise we actually check.
   */
  async getAvailability(runDestinationId: string): Promise<BackupArchiveAvailability> {
    const rd = await this.prismaService.prisma.backupRunDestination.findUnique({
      where: { id: runDestinationId },
      include: { destination: true },
    });
    if (!rd) return "Missing";
    if (rd.archiveDeletedAt) return "Removed";
    if (!rd.finalPath) return "Missing";
    try {
      if (rd.destination.type === BackupDestinationType.Local) {
        await fs.access(rd.finalPath, fs.constants.F_OK);
        return "Available";
      }
      if (rd.destination.type === BackupDestinationType.S3) {
        const parsed = this.parseS3Uri(rd.destination.output);
        if (!parsed) return "Missing";
        const Key = this.s3Key(parsed.prefix, rd.finalPath);
        await this.s3Client.send(new HeadObjectCommand({ Bucket: parsed.bucket, Key }));
        return "Available";
      }
      return "Missing";
    } catch (err) {
      if (this.isMissingError(err)) return "Missing";
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`getAvailability failed for BackupRunDestination ${runDestinationId}: ${message}`);
      return "Missing";
    }
  }

  /**
   * Aggregate availability across every destination for a run.
   *  - `Available` if any destination still has the archive (the backup
   *    is recoverable).
   *  - `Missing` if no destination has the archive AND at least one is
   *    Missing (something aged off or was lost — operator attention).
   *  - `Removed` only when every destination was intentionally cleaned up.
   *  - `Missing` for runs with no destinations at all (e.g. a Failed run)
   *    so the display doesn't over-promise.
   */
  async getRunAvailability(runId: string): Promise<BackupArchiveAvailability> {
    const rows = await this.prismaService.prisma.backupRunDestination.findMany({
      where: { runId },
      select: { id: true },
    });
    if (rows.length === 0) return "Missing";
    const states = await Promise.all(rows.map((r) => this.getAvailability(r.id)));
    if (states.some((s) => s === "Available")) return "Available";
    if (states.every((s) => s === "Removed")) return "Removed";
    return "Missing";
  }

  /**
   * Delete the archive file at the destination, flip `archiveDeletedAt`
   * so the UI shows "Removed", and publish a BackupRun update.
   *
   * Idempotent: subsequent calls (or calls against an already-removed
   * row) short-circuit after confirming the DB marker is set.
   */
  async deleteArchive(runDestinationId: string): Promise<BackupRunDestination> {
    const rd = await this.prismaService.prisma.backupRunDestination.findUniqueOrThrow({
      where: { id: runDestinationId },
      include: { destination: true },
    });
    // Already marked as removed — nothing to do.
    if (rd.archiveDeletedAt) return rd;
    // No finalPath means the archive never uploaded; mark as removed so
    // the UI stops offering a delete action without the file-system probe.
    if (!rd.finalPath) {
      const updated = await this.prismaService.prisma.backupRunDestination.update({
        where: { id: rd.id },
        data: { archiveDeletedAt: new Date() },
      });
      await this.publisher.publishRun(rd.runId, Mutation.Updated);
      return updated;
    }
    try {
      if (rd.destination.type === BackupDestinationType.Local) {
        await fs.unlink(rd.finalPath);
      } else if (rd.destination.type === BackupDestinationType.S3) {
        const parsed = this.parseS3Uri(rd.destination.output);
        if (!parsed) {
          throw new Error(
            `BackupDestination ${rd.destination.id} has an invalid S3 output URI: ${rd.destination.output ?? "(null)"}`,
          );
        }
        const Key = this.s3Key(parsed.prefix, rd.finalPath);
        await this.s3Client.send(new DeleteObjectCommand({ Bucket: parsed.bucket, Key }));
      } else {
        throw new Error(`Unsupported backup destination type: ${String(rd.destination.type)}`);
      }
      this.logger.log(
        `Deleted archive for BackupRunDestination ${rd.id} (${rd.destination.type}: ${rd.finalPath})`,
      );
    } catch (err) {
      if (!this.isMissingError(err)) throw err;
      // File was already gone - still mark as removed since the operator
      // explicitly requested cleanup. This is what they wanted.
      this.logger.log(`Archive for BackupRunDestination ${rd.id} already missing; marking removed anyway`);
    }
    const updated = await this.prismaService.prisma.backupRunDestination.update({
      where: { id: rd.id },
      data: { archiveDeletedAt: new Date() },
    });
    await this.publisher.publishRun(rd.runId, Mutation.Updated);
    return updated;
  }
}
