import { PrismaService } from "@/prisma/prisma.service";
import { OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { BaseService } from "..";
import { AppConfigService } from "@/app.config";
import { BackupDiscoveryService } from "./backup-discovery.service";
export declare class BackupService extends BaseService implements OnModuleInit {
    private prismaService;
    private schedulerRegistry;
    private backupDiscoveryService;
    private static readonly CRON_NAME;
    private static readonly STALE_HEARTBEAT_MS;
    private logger;
    private activeCron;
    constructor(prismaService: PrismaService, schedulerRegistry: SchedulerRegistry, configService: AppConfigService, backupDiscoveryService: BackupDiscoveryService);
    onModuleInit(): Promise<void>;
    private ensureDefaultPolicy;
    poll(): Promise<void>;
    execute(): Promise<void>;
    task(): Promise<void>;
    reloadPolicy(): Promise<void>;
    private unregisterCron;
    private enqueueScheduledRun;
    private recoverStaleRuns;
}
