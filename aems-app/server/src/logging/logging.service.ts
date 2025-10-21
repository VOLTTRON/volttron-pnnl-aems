import { AppConfigService } from "@/app.config";
import { LoggerService, Injectable, LogLevel, ConsoleLogger, Inject } from "@nestjs/common";
import { getLogLevels } from ".";

@Injectable()
export class AppLoggerService implements LoggerService {
  private loggers: LoggerService[] = [];

  constructor(@Inject(AppConfigService.Key) configService: AppConfigService) {
    if (configService.log.console.level) {
      this.loggers.push(
        new ConsoleLogger({
          logLevels: getLogLevels(configService.log.console.level),
          prefix: "Server",
          timestamp: true,
        }),
      );
    }
  }

  /**
   * Register a logger to be used by this service.
   * At startup a console logger is registered if the config specifies it.
   *
   * @param logger - Logger to register
   * @returns
   */
  registerLogger(logger: LoggerService) {
    if (this.loggers.includes(logger)) {
      return;
    }
    this.loggers.push(logger);
  }

  /**
   * Write a 'log' level log.
   */
  log(message: any, ...optionalParams: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    this.loggers.forEach((logger) => logger.log(message, ...optionalParams));
  }
  /**
   * Write an 'error' level log.
   */
  error(message: any, ...optionalParams: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    this.loggers.forEach((logger) => logger.error(message, ...optionalParams));
  }
  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    this.loggers.forEach((logger) => logger.warn(message, ...optionalParams));
  }
  /**
   * Write a 'debug' level log.
   */
  debug?(message: any, ...optionalParams: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    this.loggers.forEach((logger) => logger.debug?.(message, ...optionalParams));
  }
  /**
   * Write a 'verbose' level log.
   */
  verbose?(message: any, ...optionalParams: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    this.loggers.forEach((logger) => logger.verbose?.(message, ...optionalParams));
  }
  /**
   * Write a 'fatal' level log.
   */
  fatal?(message: any, ...optionalParams: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    this.loggers.forEach((logger) => logger.fatal?.(message, ...optionalParams));
  }
  /**
   * Set log levels.
   * @param levels log levels
   */
  setLogLevels?(levels: LogLevel[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    this.loggers.forEach((logger) => logger.setLogLevels?.(levels));
  }
}
