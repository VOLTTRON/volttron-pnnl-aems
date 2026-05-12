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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BackupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const client_1 = require("@prisma/client");
const __1 = require("..");
const app_config_1 = require("../../app.config");
const backup_discovery_service_1 = require("./backup-discovery.service");
let BackupService = BackupService_1 = class BackupService extends __1.BaseService {
    constructor(prismaService, schedulerRegistry, configService, backupDiscoveryService) {
        super("backup", configService);
        this.prismaService = prismaService;
        this.schedulerRegistry = schedulerRegistry;
        this.backupDiscoveryService = backupDiscoveryService;
        this.logger = new common_1.Logger(BackupService_1.name);
        this.activeCron = null;
    }
    async onModuleInit() {
        await this.ensureDefaultPolicy().catch((err) => {
            this.logger.warn({ message: err.message, stack: err.stack });
        });
        await this.recoverStaleRuns().catch((err) => {
            this.logger.warn({ message: err.message, stack: err.stack });
        });
        await this.reloadPolicy().catch((err) => {
            this.logger.warn({ message: err.message, stack: err.stack });
        });
    }
    async ensureDefaultPolicy() {
        const existing = await this.prismaService.prisma.backupPolicy.findFirst({
            orderBy: { createdAt: "asc" },
        });
        if (existing)
            return;
        await this.prismaService.prisma.backupPolicy.create({
            data: { id: "default", enabled: false, cron: "0 2 * * *", retentionDays: 30 },
        });
    }
    async poll() {
        await this.reloadPolicy().catch((err) => {
            this.logger.warn({ message: err.message, stack: err.stack });
        });
    }
    execute() {
        return super.execute();
    }
    async task() {
        await this.recoverStaleRuns();
    }
    async reloadPolicy() {
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
            const job = new cron_1.CronJob(policy.cron, () => {
                this.enqueueScheduledRun(policy.id).catch((err) => {
                    this.logger.error({ message: err.message, stack: err.stack }, "Failed to enqueue scheduled BackupRun");
                });
            });
            this.schedulerRegistry.addCronJob(BackupService_1.CRON_NAME, job);
            job.start();
            this.activeCron = policy.cron;
            this.logger.log(`Registered backup cron '${policy.cron}' for policy ${policy.id}`);
        }
        catch (err) {
            this.logger.error({ message: err.message, stack: err.stack }, `Invalid cron expression '${policy.cron}' - backup scheduling disabled until fixed`);
        }
    }
    unregisterCron() {
        if (this.activeCron !== null) {
            try {
                this.schedulerRegistry.deleteCronJob(BackupService_1.CRON_NAME);
            }
            catch {
            }
            this.activeCron = null;
            this.logger.log("Unregistered backup cron");
        }
    }
    async enqueueScheduledRun(policyId) {
        const inflight = await this.prismaService.prisma.backupRun.count({
            where: { status: { in: [client_1.BackupRunStatus.Queued, client_1.BackupRunStatus.Running] } },
        });
        if (inflight > 0) {
            this.logger.warn(`Skipping scheduled backup; ${inflight} run(s) already in flight`);
            return;
        }
        const run = await this.prismaService.prisma.backupRun.create({
            data: {
                policyId,
                status: client_1.BackupRunStatus.Queued,
                trigger: client_1.BackupRunTrigger.Scheduled,
            },
        });
        this.logger.log(`Enqueued scheduled BackupRun ${run.id}`);
    }
    async recoverStaleRuns() {
        const threshold = new Date(Date.now() - BackupService_1.STALE_HEARTBEAT_MS);
        const stale = await this.prismaService.prisma.backupRun.findMany({
            where: {
                status: client_1.BackupRunStatus.Running,
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
                    status: client_1.BackupRunStatus.Failed,
                    errorMessage: "Run was abandoned (worker heartbeat timed out).",
                    finishedAt: new Date(),
                },
            }),
            this.prismaService.prisma.backupComponent.updateMany({
                where: { runId: { in: ids }, status: client_1.BackupComponentStatus.Running },
                data: {
                    status: client_1.BackupComponentStatus.Failed,
                    error: "Worker abandoned this component.",
                    finishedAt: new Date(),
                },
            }),
        ]);
    }
};
exports.BackupService = BackupService;
BackupService.CRON_NAME = "backup-policy";
BackupService.STALE_HEARTBEAT_MS = 5 * 60 * 1000;
__decorate([
    (0, schedule_1.Timeout)(5000),
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupService.prototype, "poll", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupService.prototype, "execute", null);
exports.BackupService = BackupService = BackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        schedule_1.SchedulerRegistry,
        app_config_1.AppConfigService,
        backup_discovery_service_1.BackupDiscoveryService])
], BackupService);
//# sourceMappingURL=backup.service.js.map