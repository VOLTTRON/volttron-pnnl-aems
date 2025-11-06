import { Logger, LogLevel } from "@nestjs/common";

export const LogLevels: LogLevel[] = ["fatal", "error", "warn", "log", "debug", "verbose"];

export const getLogLevel = (level: string): LogLevel | undefined => {
  switch (level.toLowerCase().trim()) {
    case "fatal":
      return "fatal";
    case "error":
      return "error";
    case "warn":
      return "warn";
    case "log":
    case "info":
      return "log";
    case "debug":
      return "debug";
    case "verbose":
    case "trace":
      return "verbose";
    default:
      return undefined;
  }
};

const getLogLevelStrict = (level: string): LogLevel => {
  const logLevel = getLogLevel(level);
  if (logLevel) {
    return logLevel;
  } else {
    throw new Error(`Invalid log level: ${level}`);
  }
};

export const getLogLevels = (level: string): LogLevel[] =>
  LogLevels.slice(0, LogLevels.indexOf(getLogLevelStrict(level)) + 1);

export class InfoLogger extends Logger {
  /**
   * Write a 'log' level log.
   */
  info(message: any, context?: string): void;
  info(message: any, ...optionalParams: [...any, string?]): void;
  info(message: any, ...optionalParams: any[]) {
    super.log(message, optionalParams);
  }
}
