import { PrismaClient } from "@prisma/client";
import { AppConfigService } from "@/app.config";
export declare class PrismaService {
    private logger;
    readonly prisma: PrismaClient;
    constructor(configService: AppConfigService);
}
