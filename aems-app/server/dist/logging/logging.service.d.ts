import { AppConfigService } from "@/app.config";
import { LoggerService, LogLevel } from "@nestjs/common";
export declare class AppLoggerService implements LoggerService {
    private loggers;
    constructor(configService: AppConfigService);
    registerLogger(logger: LoggerService): void;
    log(message: any, ...optionalParams: any[]): any;
    error(message: any, ...optionalParams: any[]): any;
    warn(message: any, ...optionalParams: any[]): any;
    debug?(message: any, ...optionalParams: any[]): any;
    verbose?(message: any, ...optionalParams: any[]): any;
    fatal?(message: any, ...optionalParams: any[]): any;
    setLogLevels?(levels: LogLevel[]): any;
}
