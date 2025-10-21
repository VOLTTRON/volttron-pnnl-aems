import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { VolttronService } from "../volttron.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class ControlService extends BaseService {
    private prismaService;
    private subscriptionService;
    private configService;
    private volttronService;
    private logger;
    constructor(prismaService: PrismaService, subscriptionService: SubscriptionService, configService: AppConfigService, volttronService: VolttronService);
    execute(): Promise<void>;
    task(): Promise<void>;
}
