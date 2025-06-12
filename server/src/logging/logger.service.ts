import { PrismaService } from "@/prisma/prisma.service";
import { ConsoleLogger, Inject, Injectable, LogLevel } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { getLogLevels } from ".";
import { LogType } from "@prisma/client";
import { AppLoggerService } from "./logging.service";

const getPrismaLogType = (level: LogLevel): LogType => {
  switch (level) {
    case "fatal":
      return "Fatal";
    case "error":
      return "Error";
    case "warn":
      return "Warn";
    case "log":
      return "Info";
    case "debug":
      return "Debug";
    case "verbose":
      return "Trace";
    default:
      throw new Error(`Invalid log level: ${level as any}`);
  }
};

@Injectable()
export class PrismaLogger extends ConsoleLogger {
  constructor(
    @Inject(AppConfigService.Key) configService: AppConfigService,
    private prismaService: PrismaService,
    loggerService: AppLoggerService,
  ) {
    super({
      logLevels: getLogLevels(configService.log.database.level),
      prefix: "Server",
      timestamp: true,
    });
    loggerService.registerLogger(this);
  }

  protected printMessages(
    messages: unknown[],
    context: string = "",
    logLevel: LogLevel = "log",
    writeStreamType?: "stdout" | "stderr",
    errorStack?: unknown,
  ): void {
    messages.forEach((message) => {
      if (this.options.json) {
        this.printAsJson(message, {
          context,
          logLevel,
          writeStreamType,
          errorStack,
        });
        return;
      }
      const pidMessage = this.formatPid(process.pid);
      const contextMessage = this.formatContext(context);
      const timestampDiff = this.updateAndGetTimestampDiff();
      const formattedLogLevel = logLevel.toUpperCase().padStart(7, " ");
      const formattedMessage = this.formatMessage(
        logLevel,
        message,
        pidMessage,
        formattedLogLevel,
        contextMessage,
        timestampDiff,
      );
      this.prismaService.prisma.log
        .create({
          data: {
            type: getPrismaLogType(logLevel),
            message: formattedMessage,
          },
        })
        .catch((error) => {
          // log to console to prevent infinite loop
          console.error("Failed to log to database", error);
        });
    });
  }
}
