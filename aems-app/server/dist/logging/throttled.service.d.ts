import { AppConfigService } from "@/app.config";
import { LoggerService, LogLevel } from "@nestjs/common";
interface ThrottleEntry {
    firstSeen: Date;
    lastSeen: Date;
    lastLogged: Date;
    count: number;
    signature: string;
    level: LogLevel;
    message: string;
    context?: string;
}
export declare class ThrottledLoggerService implements LoggerService {
    private wrappedLogger;
    private configService;
    private throttleCache;
    private cleanupInterval;
    constructor(wrappedLogger: LoggerService, configService: AppConfigService);
    private generateSignature;
    private getThrottleWindow;
    private shouldLog;
    private updateCache;
    private formatMessage;
    private formatContext;
    private cleanup;
    private logWithThrottle;
    log(message: any, ...optionalParams: any[]): void;
    error(message: any, ...optionalParams: any[]): void;
    warn(message: any, ...optionalParams: any[]): void;
    debug(message: any, ...optionalParams: any[]): void;
    verbose(message: any, ...optionalParams: any[]): void;
    fatal(message: any, ...optionalParams: any[]): void;
    setLogLevels(levels: LogLevel[]): void;
    getStats(): {
        cacheSize: number;
        entries: ThrottleEntry[];
    };
    clearCache(): void;
    onModuleDestroy(): void;
}
export {};
