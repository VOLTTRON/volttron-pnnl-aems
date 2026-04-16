import { PrismaService } from "@/prisma/prisma.service";
import { BaseService } from "..";
import { AppConfigService } from "@/app.config";
export declare class EventService extends BaseService {
    private prismaService;
    private logger;
    private prune;
    private ageValue;
    private ageUnit;
    constructor(prismaService: PrismaService, configService: AppConfigService);
    execute(): Promise<void>;
    schedule(): boolean;
    task(): Promise<void>;
}
