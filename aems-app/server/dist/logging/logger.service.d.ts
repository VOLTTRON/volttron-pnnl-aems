import { PrismaService } from "@/prisma/prisma.service";
import { ConsoleLogger, LogLevel } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { AppLoggerService } from "./logging.service";
export declare class PrismaLogger extends ConsoleLogger {
    private prismaService;
    constructor(configService: AppConfigService, prismaService: PrismaService, loggerService: AppLoggerService);
    protected printMessages(messages: unknown[], context?: string, logLevel?: LogLevel, writeStreamType?: "stdout" | "stderr", errorStack?: unknown): void;
}
