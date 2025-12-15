import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
export declare class GrafanaRewriteMiddleware implements NestMiddleware {
    private configService;
    private prismaService;
    private logger;
    private configs;
    constructor(configService: AppConfigService, prismaService: PrismaService);
    execute(): Promise<void>;
    use(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
}
