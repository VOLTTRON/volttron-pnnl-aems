import { AppConfigService } from "@/app.config";
import { CanActivate, ExecutionContext } from "@nestjs/common";
export declare class InternalNetworkGuard implements CanActivate {
    private configService;
    private logger;
    constructor(configService: AppConfigService);
    canActivate(context: ExecutionContext): boolean;
    private getClientIp;
    private isInternalIp;
    private isIpInRange;
}
