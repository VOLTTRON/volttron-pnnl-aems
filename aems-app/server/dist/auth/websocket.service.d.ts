import { AppConfigService } from "@/app.config";
import { Request } from "express";
import { AuthjsMiddleware } from "./authjs/authjs.middleware";
import { PassportMiddleware } from "./passport/passport.middleware";
import { PrismaService } from "@/prisma/prisma.service";
export declare class WebSocketAuthService {
    private configService;
    private authjsMiddleware;
    private passportMiddleware;
    private prismaService;
    private logger;
    constructor(configService: AppConfigService, authjsMiddleware: AuthjsMiddleware, passportMiddleware: PassportMiddleware, prismaService: PrismaService);
    authenticateWebSocket(request: Request): Promise<Express.User | undefined>;
}
