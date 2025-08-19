import { NestMiddleware, OnModuleDestroy } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { RequestHandler } from "express";
import { AppConfigService } from "@/app.config";
import { ExpressAuthConfig } from "@auth/express";
import { AuthService } from "../auth.service";
export declare class AuthjsMiddleware implements NestMiddleware, OnModuleDestroy {
    private configService;
    private prismaService;
    private authService;
    private subscriptionService;
    private logger;
    readonly config: ExpressAuthConfig;
    readonly use: RequestHandler;
    constructor(configService: AppConfigService, prismaService: PrismaService, authService: AuthService, subscriptionService: SubscriptionService);
    private update;
    private getAuthjsUser;
    onModuleDestroy(): void;
}
