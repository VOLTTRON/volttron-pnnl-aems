import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
export declare class CleanupService extends BaseService {
    private prismaService;
    private logger;
    private started;
    constructor(prismaService: PrismaService, configService: AppConfigService);
    execute(): Promise<void>;
    task(): Promise<void>;
}
