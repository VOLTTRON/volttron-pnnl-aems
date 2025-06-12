import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
export declare class SeedService extends BaseService {
    private prismaService;
    private logger;
    private readonly normalizer;
    private readonly path;
    constructor(prismaService: PrismaService, configService: AppConfigService);
    execute(): Promise<void>;
    task(): Promise<void>;
}
