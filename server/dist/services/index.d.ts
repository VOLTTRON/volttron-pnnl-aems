import { AppConfigService } from "@/app.config";
export declare abstract class BaseService {
    readonly service: string;
    private running;
    private readonly runTask;
    constructor(service: string, configService: AppConfigService);
    schedule(): boolean;
    execute(): Promise<void>;
    abstract task(): Promise<void>;
}
