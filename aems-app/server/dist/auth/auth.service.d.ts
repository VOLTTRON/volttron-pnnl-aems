import { PrismaService } from "@/prisma/prisma.service";
import * as passport from "passport";
import { Request, RequestHandler } from "express";
import { AppConfigService } from "@/app.config";
import { Credentials, ProviderInfo } from "@local/common";
import { IncomingMessage } from "node:http";
export declare const Session = "session";
export declare class AuthService {
    private prismaService;
    private configService;
    private logger;
    readonly passport: passport.PassportStatic;
    readonly session: RequestHandler;
    readonly providers: Map<string, ProviderInfo<Credentials>>;
    constructor(prismaService: PrismaService, configService: AppConfigService);
    serializeUser: (user: Express.User, done: (err: Error | null, id?: string) => void) => void;
    deserializeUser: (id: string, done: (err: Error | null, user?: Express.User) => void) => void;
    registerProvider: (provider: ProviderInfo<Credentials>) => void;
    getProviderNames: () => string[];
    getProvider: (name: string) => ProviderInfo<Credentials> | undefined;
    getAuthUser: (req: Request | IncomingMessage) => Promise<Express.User | undefined>;
}
