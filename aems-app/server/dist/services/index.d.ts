import { AppConfigService } from "@/app.config";
export declare abstract class BaseService {
    private baseLogger;
    private running;
    private readonly runTask;
    private readonly shutdown;
    private readonly service;
    constructor(service: string, configService: AppConfigService);
    get enabled(): boolean;
    schedule(): boolean;
    execute(): Promise<void>;
    abstract task(): Promise<void>;
}
