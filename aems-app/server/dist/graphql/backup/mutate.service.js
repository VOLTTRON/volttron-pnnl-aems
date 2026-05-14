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
var BackupMutation_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const object_service_1 = require("./object.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const backup_discovery_service_1 = require("../../services/backup/backup-discovery.service");
const backup_publisher_service_1 = require("../../services/backup/backup-publisher.service");
const backup_archive_service_1 = require("../../services/backup/backup-archive.service");
let BackupMutation = BackupMutation_1 = class BackupMutation {
    constructor(builder, prismaService, publisher, _backupObject, backupDiscoveryService, backupArchiveService) {
        this.lastDownloadAt = new Map();
        this.logger = new common_1.Logger(BackupMutation_1.name);
        const prisma = prismaService.prisma;
        const seedDefaults = () => ({
            excludeVolumes: [],
            excludePaths: [],
        });
        const findOrCreateDefaultPolicy = async () => {
            const existing = await prisma.backupPolicy.findFirst({ orderBy: { createdAt: "asc" } });
            if (existing)
                return existing;
            const seeded = seedDefaults();
            return prisma.backupPolicy.create({
                data: { id: "default", enabled: false, cron: "0 2 * * *", retentionDays: 30, ...seeded },
            });
        };
        const publishPolicy = (id, mutation) => publisher.publishPolicy(id, mutation);
        const publishDestination = (id, mutation) => publisher.publishDestination(id, mutation);
        const publishRun = (id, mutation) => publisher.publishRun(id, mutation);
        const publishKey = (id, mutation) => publisher.publishKey(id, mutation);
        builder.mutationField("updateBackupPolicy", (t) => t.prismaField({
            description: "Upsert the single BackupPolicy.",
            authScopes: { admin: true },
            type: "BackupPolicy",
            args: {
                enabled: t.arg({ type: "Boolean" }),
                cron: t.arg({ type: "String" }),
                retentionDays: t.arg({ type: "Int" }),
                excludeVolumes: t.arg({ type: ["String"] }),
                excludePaths: t.arg({ type: ["String"] }),
                excludeServices: t.arg({ type: ["String"] }),
                excludeEnvFiles: t.arg({ type: ["String"] }),
                extraEnvFiles: t.arg({ type: ["String"] }),
            },
            resolve: async (query, _root, args) => {
                const existing = await prisma.backupPolicy.findFirst({ orderBy: { createdAt: "asc" } });
                const data = {};
                if (args.enabled != null)
                    data.enabled = args.enabled;
                if (args.cron != null)
                    data.cron = args.cron;
                if (args.retentionDays != null)
                    data.retentionDays = args.retentionDays;
                if (args.excludeVolumes != null)
                    data.excludeVolumes = args.excludeVolumes;
                if (args.excludePaths != null)
                    data.excludePaths = args.excludePaths;
                if (args.excludeServices != null)
                    data.excludeServices = args.excludeServices;
                if (args.excludeEnvFiles != null)
                    data.excludeEnvFiles = args.excludeEnvFiles;
                if (args.extraEnvFiles != null)
                    data.extraEnvFiles = args.extraEnvFiles;
                let policy;
                if (existing) {
                    policy = await prisma.backupPolicy.update({ ...query, where: { id: existing.id }, data });
                }
                else {
                    const seeded = seedDefaults();
                    policy = await prisma.backupPolicy.create({
                        ...query,
                        data: { id: "default", enabled: false, cron: "0 2 * * *", retentionDays: 30, ...seeded, ...data },
                    });
                }
                await publishPolicy(policy.id, existing ? common_2.Mutation.Updated : common_2.Mutation.Created);
                return policy;
            },
        }));
        builder.mutationField("createBackupDestination", (t) => t.prismaField({
            description: "Create a new backup destination.",
            authScopes: { admin: true },
            type: "BackupDestination",
            args: {
                name: t.arg({ type: "String", required: true }),
                type: t.arg({ type: "BackupDestinationType", required: true }),
                output: t.arg({ type: "String" }),
                enabled: t.arg({ type: "Boolean" }),
                sseMode: t.arg({ type: "String" }),
                sseKmsKeyId: t.arg({ type: "String" }),
                order: t.arg({ type: "Int" }),
            },
            resolve: async (query, _root, args) => {
                let output = null;
                if (args.type !== "Local") {
                    if (args.output == null || args.output.trim() === "") {
                        throw new Error(`Destination type ${args.type} requires an output path.`);
                    }
                    output = args.output;
                }
                const policy = await findOrCreateDefaultPolicy();
                const dest = await prisma.backupDestination.create({
                    ...query,
                    data: {
                        policyId: policy.id,
                        name: args.name,
                        type: args.type,
                        output,
                        enabled: args.enabled ?? true,
                        sseMode: args.sseMode ?? null,
                        sseKmsKeyId: args.sseKmsKeyId ?? null,
                        order: args.order ?? 0,
                    },
                });
                await publishDestination(dest.id, common_2.Mutation.Created);
                return dest;
            },
        }));
        builder.mutationField("updateBackupDestination", (t) => t.prismaField({
            description: "Update a backup destination.",
            authScopes: { admin: true },
            type: "BackupDestination",
            args: {
                id: t.arg({ type: "String", required: true }),
                name: t.arg({ type: "String" }),
                type: t.arg({ type: "BackupDestinationType" }),
                output: t.arg({ type: "String" }),
                enabled: t.arg({ type: "Boolean" }),
                sseMode: t.arg({ type: "String" }),
                sseKmsKeyId: t.arg({ type: "String" }),
                order: t.arg({ type: "Int" }),
            },
            resolve: async (query, _root, args) => {
                const data = {};
                if (args.name != null)
                    data.name = args.name;
                if (args.type != null)
                    data.type = args.type;
                if (args.enabled != null)
                    data.enabled = args.enabled;
                if (args.sseMode != null)
                    data.sseMode = args.sseMode;
                if (args.sseKmsKeyId != null)
                    data.sseKmsKeyId = args.sseKmsKeyId;
                if (args.order != null)
                    data.order = args.order;
                if (args.type === "Local") {
                    data.output = null;
                }
                else if (args.type != null) {
                    if (args.output == null || args.output.trim() === "") {
                        throw new Error(`Destination type ${args.type} requires an output path.`);
                    }
                    data.output = args.output;
                }
                else if (args.output != null) {
                    data.output = args.output;
                }
                const dest = await prisma.backupDestination.update({ ...query, where: { id: args.id }, data });
                await publishDestination(dest.id, common_2.Mutation.Updated);
                return dest;
            },
        }));
        builder.mutationField("deleteBackupDestination", (t) => t.prismaField({
            description: "Delete a backup destination.",
            authScopes: { admin: true },
            type: "BackupDestination",
            args: { id: t.arg({ type: "String", required: true }) },
            resolve: async (query, _root, args) => {
                const dest = await prisma.backupDestination.delete({ ...query, where: { id: args.id } });
                await publishDestination(dest.id, common_2.Mutation.Deleted);
                return dest;
            },
        }));
        builder.mutationField("triggerBackupRun", (t) => t.prismaField({
            description: "Enqueue a manual backup run for immediate execution by the sidecar worker.",
            authScopes: { admin: true },
            type: "BackupRun",
            resolve: async (query, _root, _args, ctx) => {
                const policy = await findOrCreateDefaultPolicy();
                const inflight = await prisma.backupRun.count({
                    where: { status: { in: ["Queued", "Running"] } },
                });
                if (inflight > 0) {
                    throw new Error("A backup is already in progress; wait for it to finish before starting another.");
                }
                const run = await prisma.backupRun.create({
                    ...query,
                    data: {
                        policyId: policy.id,
                        status: "Queued",
                        trigger: "Manual",
                        requestedById: ctx?.user?.id ?? null,
                    },
                });
                await publishRun(run.id, common_2.Mutation.Created);
                return run;
            },
        }));
        builder.mutationField("cancelBackupRun", (t) => t.prismaField({
            description: "Request cancellation of an in-flight backup run.",
            authScopes: { admin: true },
            type: "BackupRun",
            args: { id: t.arg({ type: "String", required: true }) },
            resolve: async (query, _root, args) => {
                const run = await prisma.backupRun.update({
                    ...query,
                    where: { id: args.id },
                    data: { cancelRequested: true },
                });
                await publishRun(run.id, common_2.Mutation.Updated);
                return run;
            },
        }));
        builder.mutationField("deleteBackupArchive", (t) => t.prismaField({
            description: "Delete the archive file for a specific backup run destination. The DB record is retained so the run remains visible as an audit trail; only the archive file itself is removed.",
            authScopes: { admin: true },
            type: "BackupRunDestination",
            args: { runDestinationId: t.arg({ type: "String", required: true }) },
            resolve: async (query, _root, args) => {
                await backupArchiveService.deleteArchive(args.runDestinationId);
                return prisma.backupRunDestination.findUniqueOrThrow({
                    ...query,
                    where: { id: args.runDestinationId },
                });
            },
        }));
        builder.mutationField("acknowledgeBackupKey", (t) => t.prismaField({
            description: "Acknowledge that the backup encryption key has been securely stored offline.",
            authScopes: { admin: true },
            type: "BackupKey",
            args: { id: t.arg({ type: "String", required: true }) },
            resolve: async (query, _root, args, ctx) => {
                const key = await prisma.backupKey.update({
                    ...query,
                    where: { id: args.id },
                    data: {
                        acknowledged: true,
                        acknowledgedAt: new Date(),
                        acknowledgedById: ctx?.user?.id ?? null,
                    },
                });
                await publishKey(key.id, common_2.Mutation.Updated);
                return key;
            },
        }));
        builder.mutationField("rotateBackupKey", (t) => t.prismaField({
            description: "Rotate the active backup encryption key. Retires the current key (sets active=false, rotatedAt=now) and lets the sidecar worker generate a fresh keypair on its next poll. The old key row is retained so historical archives remain decryptable.",
            authScopes: { admin: true },
            type: "BackupKey",
            resolve: async (query) => {
                const current = await prisma.backupKey.findFirst({ where: { active: true } });
                if (current) {
                    await prisma.backupKey.update({
                        where: { id: current.id },
                        data: { active: false, rotatedAt: new Date() },
                    });
                    await publishKey(current.id, common_2.Mutation.Updated);
                }
                const latest = await prisma.backupKey.findFirst({
                    ...query,
                    orderBy: { createdAt: "desc" },
                });
                return latest ?? current;
            },
        }));
        builder.mutationField("downloadBackupPrivateKey", (t) => t.field({
            description: "Return the private key material for an acknowledged BackupKey. Rate limited to one call per minute per user and audited via the Log service.",
            authScopes: { admin: true },
            type: "String",
            args: { id: t.arg({ type: "String", required: true }) },
            resolve: async (_root, args, ctx) => {
                const userId = ctx?.user?.id ?? "anonymous";
                const now = Date.now();
                const last = this.lastDownloadAt.get(userId) ?? 0;
                if (now - last < BackupMutation_1.DOWNLOAD_COOLDOWN_MS) {
                    throw new Error("Please wait before downloading the backup private key again.");
                }
                this.lastDownloadAt.set(userId, now);
                const key = await prisma.backupKey.findUniqueOrThrow({ where: { id: args.id } });
                if (!key.acknowledged) {
                    throw new Error("You must acknowledge the key before downloading it.");
                }
                this.logger.warn(`Backup private key downloaded: userId=${userId} keyId=${key.id} fingerprint=${key.fingerprint}`, BackupMutation_1.name);
                const fs = await Promise.resolve().then(() => require("fs/promises"));
                if (!key.privateKeyPath) {
                    throw new Error("Private key material is not available for this key.");
                }
                return fs.readFile(key.privateKeyPath, "utf-8");
            },
        }));
    }
};
exports.BackupMutation = BackupMutation;
BackupMutation.DOWNLOAD_COOLDOWN_MS = 60 * 1000;
exports.BackupMutation = BackupMutation = BackupMutation_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        backup_publisher_service_1.BackupSubscriptionPublisher,
        object_service_1.BackupObject,
        backup_discovery_service_1.BackupDiscoveryService,
        backup_archive_service_1.BackupArchiveService])
], BackupMutation);
//# sourceMappingURL=mutate.service.js.map