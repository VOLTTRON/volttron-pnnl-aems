import { AppConfigService } from "@/app.config";
import { OnModuleDestroy } from "@nestjs/common";
export declare class VolttronService implements OnModuleDestroy {
    private configService;
    private logger;
    private readonly agent;
    private readonly maxRetries;
    constructor(configService: AppConfigService);
    onModuleDestroy(): void;
    makeAuthCall(): Promise<string>;
    makeApiCall(id: string, method: string, token: string, data: any): Promise<any>;
    private makeApiCallWithRetry;
}
