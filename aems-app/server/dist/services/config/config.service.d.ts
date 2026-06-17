import { AppConfigService } from "@/app.config";
import { BaseService } from "..";
import { OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { VolttronService } from "../volttron.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class ConfigService extends BaseService implements OnApplicationBootstrap {
    private prismaService;
    private subscriptionService;
    private configService;
    private volttronService;
    private logger;
    constructor(prismaService: PrismaService, subscriptionService: SubscriptionService, configService: AppConfigService, volttronService: VolttronService);
    onApplicationBootstrap(): Promise<void>;
    execute(): Promise<void>;
    private buildOccupancyPayload;
    task(): Promise<void>;
}
