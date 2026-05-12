"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BackupWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupWorkerService = void 0;
const fs = require("fs/promises");
const path = require("path");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const common_2 = require("@local/common");
const prisma_service_1 = require("../prisma/prisma.service");
const backup_publisher_service_1 = require("../services/backup/backup-publisher.service");
const backup_discovery_service_1 = require("../services/backup/backup-discovery.service");
const LOCAL_ARCHIVE_DIR = "/var/lib/backup/archives";
let BackupWorkerService = BackupWorkerService_1 = class BackupWorkerService {
    constructor(prismaService, publisher, discoveryService) {
        this.prismaService = prismaService;
        this.publisher = publisher;
        this.discoveryService = discoveryService;
        this.logger = new common_1.Logger(BackupWorkerService_1.name);
    }
    get prisma() {
        return this.prismaService.prisma;
    }
    async claimNextRun() {
        const claimed = await this.prisma.$queryRaw `
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
        if (!row)
            return null;
        await this.publisher.publishRun(row.id, common_2.Mutation.Updated);
        const policy = await this.prisma.backupPolicy.findUniqueOrThrow({ where: { id: row.policyId } });
        const destinations = await this.prisma.backupDestination.findMany({
            where: { policyId: row.policyId, enabled: true },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        });
        const activeKey = await this.prisma.backupKey.findFirst({
            where: { active: true },
            orderBy: { createdAt: "desc" },
        });
        let autoExcludeVolumes = [];
        let autoExcludePaths = [];
        let includeDatabases = [];
        try {
            const discovery = await this.discoveryService.discover();
            autoExcludeVolumes = discovery.volumes.filter((v) => v.autoExclude).map((v) => v.name);
            autoExcludePaths = discovery.paths.filter((p) => p.autoExclude).map((p) => p.path);
            includeDatabases = discovery.services
                .filter((s) => s.backupStrategy !== null && !policy.excludeServices.includes(s.name))
                .map((s) => `${s.name}:${(s.engine ?? "").toLowerCase()}`)
                .filter((s) => !s.endsWith(":"));
        }
        catch (e) {
            this.logger.warn(`Discovery failed during claim; auto-exclude skipped: ${e.message}`);
        }
        const union = (a, b) => [...new Set([...a, ...b])];
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
    async findLocalArchive(runId) {
        for (const ext of ["age", "gpg"]) {
            const candidate = path.join(LOCAL_ARCHIVE_DIR, `${runId}.tar.gz.${ext}`);
            try {
                const stat = await fs.stat(candidate);
                if (stat.isFile()) {
                    return { archivePath: candidate, archiveBytes: Number(stat.size) };
                }
            }
            catch {
            }
        }
        return null;
    }
    async reconcileStale(staleMs) {
        const cutoff = new Date(Date.now() - staleMs);
        const candidates = await this.prisma.backupRun.findMany({
            where: {
                OR: [
                    {
                        status: client_1.BackupRunStatus.Running,
                        OR: [{ heartbeatAt: null }, { heartbeatAt: { lt: cutoff } }],
                    },
                    {
                        status: client_1.BackupRunStatus.Failed,
                        keyFingerprint: null,
                        archivePath: null,
                        archiveSha256: null,
                    },
                ],
            },
            select: { id: true, policyId: true, status: true },
        });
        if (candidates.length === 0)
            return 0;
        const recovered = [];
        const toFail = [];
        for (const run of candidates) {
            const found = await this.findLocalArchive(run.id);
            if (found) {
                await this.recoverRun(run.id, run.policyId, found);
                recovered.push(run.id);
            }
            else if (run.status === client_1.BackupRunStatus.Running) {
                toFail.push(run.id);
            }
        }
        if (toFail.length > 0) {
            await this.prisma.backupRun.updateMany({
                where: { id: { in: toFail } },
                data: {
                    status: client_1.BackupRunStatus.Failed,
                    errorMessage: "Worker crashed or was restarted mid-run (no heartbeat).",
                    finishedAt: new Date(),
                },
            });
            for (const id of toFail) {
                await this.publisher.publishRun(id, common_2.Mutation.Updated);
            }
        }
        if (recovered.length > 0) {
            this.logger.log(`Reconciled ${candidates.length} run(s): ${recovered.length} recovered as Success from on-disk archive, ${toFail.length} marked Failed.`);
        }
        else if (toFail.length > 0) {
            this.logger.log(`Reconciled ${toFail.length} stale Running run(s) to Failed.`);
        }
        return toFail.length + recovered.length;
    }
    async recoverRun(runId, policyId, archive) {
        const activeKey = await this.prisma.backupKey.findFirst({
            where: { active: true },
            orderBy: { createdAt: "desc" },
            select: { fingerprint: true },
        });
        await this.prisma.backupRun.update({
            where: { id: runId },
            data: {
                status: client_1.BackupRunStatus.Success,
                errorMessage: null,
                finishedAt: new Date(),
                archivePath: archive.archivePath,
                archiveBytes: BigInt(archive.archiveBytes),
                ...(activeKey?.fingerprint ? { keyFingerprint: activeKey.fingerprint } : {}),
            },
        });
        const localDestinations = await this.prisma.backupDestination.findMany({
            where: { policyId, enabled: true, type: client_1.BackupDestinationType.Local },
            select: { id: true },
        });
        for (const dest of localDestinations) {
            const existing = await this.prisma.backupRunDestination.findFirst({
                where: { runId, destinationId: dest.id },
                select: { id: true },
            });
            if (existing)
                continue;
            await this.prisma.backupRunDestination.create({
                data: {
                    runId,
                    destinationId: dest.id,
                    status: client_1.BackupComponentStatus.Success,
                    finalPath: archive.archivePath,
                    uploadedBytes: BigInt(archive.archiveBytes),
                    startedAt: new Date(),
                    finishedAt: new Date(),
                },
            });
        }
        await this.publisher.publishRun(runId, common_2.Mutation.Updated);
    }
    async heartbeat(runId) {
        try {
            const run = await this.prisma.backupRun.update({
                where: { id: runId },
                data: { heartbeatAt: new Date() },
                select: { cancelRequested: true, status: true },
            });
            return run;
        }
        catch {
            throw new common_1.NotFoundException(`BackupRun ${runId} not found`);
        }
    }
    async upsertComponent(runId, input) {
        const existing = await this.prisma.backupComponent.findFirst({
            where: { runId, type: input.type, name: input.name },
            select: { id: true, startedAt: true },
        });
        const isRunning = input.status === client_1.BackupComponentStatus.Running;
        const isTerminal = [client_1.BackupComponentStatus.Success, client_1.BackupComponentStatus.Failed, client_1.BackupComponentStatus.Skipped].includes(input.status);
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
        }
        else {
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
        await this.publisher.publishRun(runId, common_2.Mutation.Updated);
    }
    async upsertRunDestination(runId, input) {
        const existing = await this.prisma.backupRunDestination.findFirst({
            where: { runId, destinationId: input.destinationId },
            select: { id: true, startedAt: true },
        });
        const isRunning = input.status === client_1.BackupComponentStatus.Running;
        const isTerminal = [client_1.BackupComponentStatus.Success, client_1.BackupComponentStatus.Failed, client_1.BackupComponentStatus.Skipped].includes(input.status);
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
        }
        else {
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
        await this.publisher.publishRun(runId, common_2.Mutation.Updated);
    }
    async updateRunArchive(runId, input) {
        const data = {};
        if (input.archivePath != null)
            data.archivePath = input.archivePath;
        if (input.archiveBytes != null)
            data.archiveBytes = BigInt(input.archiveBytes);
        if (input.archiveSha256 != null)
            data.archiveSha256 = input.archiveSha256;
        if (input.keyFingerprint != null)
            data.keyFingerprint = input.keyFingerprint;
        if (input.manifest !== undefined)
            data.manifest = input.manifest;
        if (Object.keys(data).length === 0)
            return;
        await this.prisma.backupRun.update({ where: { id: runId }, data: data });
        await this.publisher.publishRun(runId, common_2.Mutation.Updated);
    }
    async finalizeRun(runId, input) {
        const data = {
            status: input.status,
            finishedAt: new Date(),
            heartbeatAt: new Date(),
        };
        if (input.errorMessage != null)
            data.errorMessage = input.errorMessage;
        if (input.archivePath != null)
            data.archivePath = input.archivePath;
        if (input.archiveBytes != null)
            data.archiveBytes = BigInt(input.archiveBytes);
        if (input.archiveSha256 != null)
            data.archiveSha256 = input.archiveSha256;
        if (input.keyFingerprint != null)
            data.keyFingerprint = input.keyFingerprint;
        if (input.manifest !== undefined)
            data.manifest = input.manifest;
        await this.prisma.backupRun.update({ where: { id: runId }, data: data });
        await this.publisher.publishRun(runId, common_2.Mutation.Updated);
    }
    async upsertKey(input) {
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
            await this.publisher.publishKey(updated.id, common_2.Mutation.Updated);
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
        await this.publisher.publishKey(created.id, common_2.Mutation.Created);
        return { id: created.id, created: true, active: true };
    }
};
exports.BackupWorkerService = BackupWorkerService;
exports.BackupWorkerService = BackupWorkerService = BackupWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        backup_publisher_service_1.BackupSubscriptionPublisher,
        backup_discovery_service_1.BackupDiscoveryService])
], BackupWorkerService);
//# sourceMappingURL=backup.service.js.map