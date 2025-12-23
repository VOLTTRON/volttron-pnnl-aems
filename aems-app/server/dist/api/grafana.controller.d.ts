import { AppConfigService } from "@/app.config";
import { Response } from "express";
export declare class GrafanaController {
    private configService;
    private logger;
    private configs;
    constructor(configService: AppConfigService);
    execute(): Promise<void>;
    dashboard(res: Response, campus: string, building: string, unit: string): void | Response<any, Record<string, any>>;
}
