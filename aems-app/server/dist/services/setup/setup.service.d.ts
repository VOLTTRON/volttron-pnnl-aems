import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class SetupService extends BaseService {
    private prismaService;
    private subscriptionService;
    private configService;
    private logger;
    constructor(prismaService: PrismaService, subscriptionService: SubscriptionService, configService: AppConfigService);
    execute(): Promise<void>;
    task(): Promise<void>;
}
