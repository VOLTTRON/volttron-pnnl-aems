import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { ExpressAuthConfig } from "@auth/express";
import { AuthService } from "../auth.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare const buildConfig: (configService: AppConfigService, prismaService: PrismaService, authService: AuthService, subscriptionService: SubscriptionService) => ExpressAuthConfig;
