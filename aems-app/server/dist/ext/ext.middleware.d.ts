import { AppConfigService } from "@/app.config";
import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
export declare class ExtRewriteMiddleware implements NestMiddleware {
    private configService;
    private logger;
    private proxies;
    constructor(configService: AppConfigService);
    use(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
}
