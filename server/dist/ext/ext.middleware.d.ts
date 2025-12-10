import { AppConfigService } from "@/app.config";
import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as http from "http";
export declare class ExtRewriteMiddleware implements NestMiddleware {
    private logger;
    private configs;
    constructor(configService: AppConfigService);
    use(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>> | http.ClientRequest;
}
