import { AppConfigService } from "@/app.config";
export declare class VolttronService {
    private configService;
    private logger;
    constructor(configService: AppConfigService);
    makeAuthCall(): Promise<string>;
    makeApiCall(id: string, method: string, token: string, data: any): Promise<any>;
}
