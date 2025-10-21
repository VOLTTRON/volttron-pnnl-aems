import { AuthService } from "@/auth/auth.service";
import { NestMiddleware } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ExpressAuthConfig } from "@auth/express";
import { RequestHandler } from "express";
export declare class AuthjsController implements NestMiddleware {
    private configService;
    private logger;
    readonly config: ExpressAuthConfig;
    readonly use: RequestHandler;
    constructor(configService: AppConfigService, prismaService: PrismaService, authService: AuthService, subscriptionService: SubscriptionService);
}
