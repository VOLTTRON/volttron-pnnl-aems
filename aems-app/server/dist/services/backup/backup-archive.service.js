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
var BackupArchiveService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupArchiveService = exports.BackupArchiveAvailabilityValues = void 0;
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const fs = require("fs/promises");
const path = require("path");
const client_s3_1 = require("@aws-sdk/client-s3");
const common_2 = require("@local/common");
const backup_publisher_service_1 = require("./backup-publisher.service");
exports.BackupArchiveAvailabilityValues = ["Available", "Missing", "Removed"];
let BackupArchiveService = BackupArchiveService_1 = class BackupArchiveService {
    constructor(prismaService, publisher) {
        this.prismaService = prismaService;
        this.publisher = publisher;
        this.logger = new common_1.Logger(BackupArchiveService_1.name);
        this.s3ClientInstance = null;
    }
    get s3Client() {
        if (!this.s3ClientInstance) {
            this.s3ClientInstance = new client_s3_1.S3Client({});
        }
        return this.s3ClientInstance;
    }
    parseS3Uri(uri) {
        if (!uri)
            return null;
        const match = /^s3:\/\/([^/]+)(?:\/(.*))?$/.exec(uri.trim());
        if (!match)
            return null;
        const [, bucket, prefix] = match;
        return { bucket, prefix: prefix ?? "" };
    }
    s3Key(prefix, finalPath) {
        const base = path.posix.basename(finalPath);
        if (!prefix)
            return base;
        return prefix.endsWith("/") ? `${prefix}${base}` : `${prefix}/${base}`;
    }
    isMissingError(err) {
        if (!err || typeof err !== "object")
            return false;
        const maybe = err;
        if (maybe.code === "ENOENT")
            return true;
        if (maybe.$metadata?.httpStatusCode === 404)
            return true;
        if (maybe.name === "NotFound" || maybe.name === "NoSuchKey")
            return true;
        if (err instanceof client_s3_1.NotFound || err instanceof client_s3_1.NoSuchKey)
            return true;
        return false;
    }
    async getAvailability(runDestinationId) {
        const rd = await this.prismaService.prisma.backupRunDestination.findUnique({
            where: { id: runDestinationId },
            include: { destination: true },
        });
        if (!rd)
            return "Missing";
        if (rd.archiveDeletedAt)
            return "Removed";
        if (!rd.finalPath)
            return "Missing";
        try {
            if (rd.destination.type === client_1.BackupDestinationType.Local) {
                await fs.access(rd.finalPath, fs.constants.F_OK);
                return "Available";
            }
            if (rd.destination.type === client_1.BackupDestinationType.S3) {
                const parsed = this.parseS3Uri(rd.destination.output);
                if (!parsed)
                    return "Missing";
                const Key = this.s3Key(parsed.prefix, rd.finalPath);
                await this.s3Client.send(new client_s3_1.HeadObjectCommand({ Bucket: parsed.bucket, Key }));
                return "Available";
            }
            return "Missing";
        }
        catch (err) {
            if (this.isMissingError(err))
                return "Missing";
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(`getAvailability failed for BackupRunDestination ${runDestinationId}: ${message}`);
            return "Missing";
        }
    }
    async getRunAvailability(runId) {
        const rows = await this.prismaService.prisma.backupRunDestination.findMany({
            where: { runId },
            select: { id: true },
        });
        if (rows.length === 0)
            return "Missing";
        const states = await Promise.all(rows.map((r) => this.getAvailability(r.id)));
        if (states.some((s) => s === "Available"))
            return "Available";
        if (states.every((s) => s === "Removed"))
            return "Removed";
        return "Missing";
    }
    async deleteArchive(runDestinationId) {
        const rd = await this.prismaService.prisma.backupRunDestination.findUniqueOrThrow({
            where: { id: runDestinationId },
            include: { destination: true },
        });
        if (rd.archiveDeletedAt)
            return rd;
        if (!rd.finalPath) {
            const updated = await this.prismaService.prisma.backupRunDestination.update({
                where: { id: rd.id },
                data: { archiveDeletedAt: new Date() },
            });
            await this.publisher.publishRun(rd.runId, common_2.Mutation.Updated);
            return updated;
        }
        try {
            if (rd.destination.type === client_1.BackupDestinationType.Local) {
                await fs.unlink(rd.finalPath);
            }
            else if (rd.destination.type === client_1.BackupDestinationType.S3) {
                const parsed = this.parseS3Uri(rd.destination.output);
                if (!parsed) {
                    throw new Error(`BackupDestination ${rd.destination.id} has an invalid S3 output URI: ${rd.destination.output ?? "(null)"}`);
                }
                const Key = this.s3Key(parsed.prefix, rd.finalPath);
                await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: parsed.bucket, Key }));
            }
            else {
                throw new Error(`Unsupported backup destination type: ${String(rd.destination.type)}`);
            }
            this.logger.log(`Deleted archive for BackupRunDestination ${rd.id} (${rd.destination.type}: ${rd.finalPath})`);
        }
        catch (err) {
            if (!this.isMissingError(err))
                throw err;
            this.logger.log(`Archive for BackupRunDestination ${rd.id} already missing; marking removed anyway`);
        }
        const updated = await this.prismaService.prisma.backupRunDestination.update({
            where: { id: rd.id },
            data: { archiveDeletedAt: new Date() },
        });
        await this.publisher.publishRun(rd.runId, common_2.Mutation.Updated);
        return updated;
    }
};
exports.BackupArchiveService = BackupArchiveService;
exports.BackupArchiveService = BackupArchiveService = BackupArchiveService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        backup_publisher_service_1.BackupSubscriptionPublisher])
], BackupArchiveService);
//# sourceMappingURL=backup-archive.service.js.map