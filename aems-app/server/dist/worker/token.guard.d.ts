import { CanActivate, ExecutionContext } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
export declare class WorkerTokenGuard implements CanActivate {
    private readonly configService;
    private readonly logger;
    private readonly expected;
    constructor(configService: AppConfigService);
    canActivate(context: ExecutionContext): boolean;
}
