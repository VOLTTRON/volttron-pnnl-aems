import { Logger, LogLevel } from "@nestjs/common";
export declare const LogLevels: LogLevel[];
export declare const getLogLevel: (level: string) => LogLevel | undefined;
export declare const getLogLevels: (level: string) => LogLevel[];
export declare class InfoLogger extends Logger {
    info(message: any, context?: string): void;
    info(message: any, ...optionalParams: [...any, string?]): void;
}
