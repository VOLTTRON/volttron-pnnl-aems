import { AppConfigService } from "@/app.config";
import { Request, Response } from "express";
export declare class GrafanaController {
    private configService;
    private logger;
    private configs;
    constructor(configService: AppConfigService);
    execute(): Promise<void>;
    info(): {
        building: string;
        campus: string;
    };
    dashboard(req: Request, res: Response, user: Express.User, campus: string, building: string, unit: string): void | Response<any, Record<string, any>>;
}
