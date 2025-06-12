import { PrismaService } from "@/prisma/prisma.service";
import { BaseService } from "..";
import { AppConfigService } from "@/app.config";
export declare class LogService extends BaseService {
    private prismaService;
    private logger;
    private started;
    private prune;
    constructor(prismaService: PrismaService, configService: AppConfigService);
    execute(): Promise<void>;
    schedule(): boolean;
    task(): Promise<void>;
}
