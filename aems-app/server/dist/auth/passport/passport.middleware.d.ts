import { NestMiddleware, OnModuleDestroy } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { LoggerService } from "@nestjs/common";
import * as passport from "passport";
import { PrismaSessionStore } from "@/auth/passport/session.service";
import { RedisStore } from "connect-redis";
import { RequestHandler } from "express";
import { AppConfigService } from "@/app.config";
import { AuthService } from "../auth.service";
export declare const Session = "session";
export declare const sessionStoreFactory: (prismaService: PrismaService, configService: AppConfigService, logger: LoggerService) => PrismaSessionStore | RedisStore | undefined;
export declare class PassportMiddleware implements NestMiddleware, OnModuleDestroy {
    private configService;
    private prismaService;
    private authService;
    private logger;
    readonly passport: passport.PassportStatic;
    readonly use: RequestHandler;
    constructor(configService: AppConfigService, prismaService: PrismaService, authService: AuthService);
    private update;
    serializeUser: (user: Express.User, done: (err: Error | null, id?: string) => void) => void;
    deserializeUser: (id: string, done: (err: Error | null, user?: Express.User) => void) => void;
    onModuleDestroy(): void;
}
