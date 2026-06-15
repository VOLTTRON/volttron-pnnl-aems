import { AppConfigService } from "@/app.config";
import { Injectable, LoggerService, LogLevel } from "@nestjs/common";
import { createHash } from "crypto";

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

/**
 * A logger wrapper that throttles duplicate log messages to reduce log clutter.
 * Tracks message signatures and suppresses repeated messages within configurable time windows.
 */
@Injectable()
export class ThrottledLoggerService implements LoggerService {
  private throttleCache = new Map<string, ThrottleEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private wrappedLogger: LoggerService,
    private configService: AppConfigService,
  ) {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Generate a signature for a log message based on level, message, and context
   */
  private generateSignature(level: LogLevel, message: any, context?: string): string {
    const messageStr = typeof message === "string" ? message : JSON.stringify(message);
    const contextStr = context || "";
    const combined = `${level}:${contextStr}:${messageStr}`;
    return createHash("md5").update(combined).digest("hex");
  }

  /**
   * Get the throttle window in seconds for a given log level
   */
  private getThrottleWindow(level: LogLevel): number {
    return this.configService.log.throttle.debounce[level] || this.configService.log.throttle.debounce.log;
  }

  /**
   * Check if a message should be logged or throttled
   */
  private shouldLog(signature: string, level: LogLevel): boolean {
    if (!this.configService.log.throttle.enabled) {
      return true;
    }

    const entry = this.throttleCache.get(signature);
    if (!entry) {
      return true;
    }

    const windowMs = this.getThrottleWindow(level) * 1000;
    const timeSinceLastLog = Date.now() - entry.lastLogged.getTime();

    return timeSinceLastLog >= windowMs;
  }

  /**
   * Update throttle cache entry
   */
  private updateCache(
    signature: string,
    level: LogLevel,
    message: any,
    context?: string,
    logged: boolean = false,
  ): void {
    const now = new Date();
    const entry = this.throttleCache.get(signature);

    if (!entry) {
      this.throttleCache.set(signature, {
        firstSeen: now,
        lastSeen: now,
        lastLogged: now,
        count: 1,
        signature,
        level,
        message: typeof message === "string" ? message : JSON.stringify(message),
        context,
      });
    } else {
      entry.lastSeen = now;
      entry.count += 1;
      if (logged) {
        entry.lastLogged = now;
        entry.firstSeen = now;
        entry.count = 1;
      }
    }
  }

  /**
   * Format message with occurrence count if throttled
   * Returns the original message for non-string types to preserve error objects
   */
  private formatMessage(signature: string, message: unknown): unknown {
    const entry = this.throttleCache.get(signature);
    if (!entry || entry.count <= 1) {
      return message;
    }

    // Only append occurrence count to string messages
    // For objects/errors, we'll add the count to the context instead
    if (typeof message === "string") {
      const windowSeconds = this.getThrottleWindow(entry.level);
      const minutes = Math.floor(windowSeconds / 60);
      const timeUnit = minutes > 0 ? `${minutes} minute${minutes !== 1 ? "s" : ""}` : `${windowSeconds} seconds`;
      return `${message} [occurred ${entry.count} times in last ${timeUnit}]`;
    }

    return message;
  }

  /**
   * Format context with occurrence count for non-string messages
   */
  private formatContext(signature: string, context?: string): string | undefined {
    const entry = this.throttleCache.get(signature);
    if (!entry || entry.count <= 1) {
      return context;
    }

    const windowSeconds = this.getThrottleWindow(entry.level);
    const minutes = Math.floor(windowSeconds / 60);
    const timeUnit = minutes > 0 ? `${minutes} minute${minutes !== 1 ? "s" : ""}` : `${windowSeconds} seconds`;
    const countInfo = `[occurred ${entry.count} times in last ${timeUnit}]`;

    return context ? `${context} ${countInfo}` : countInfo;
  }

  /**
   * Clean up old entries from the cache
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = Math.max(...Object.values(this.configService.log.throttle.debounce)) * 2 * 1000; // 2x the longest window

    for (const [signature, entry] of this.throttleCache.entries()) {
      const age = now - entry.lastSeen.getTime();
      if (age > maxAge) {
        this.throttleCache.delete(signature);
      }
    }
  }

  /**
   * Internal logging method that handles throttling
   */
  private logWithThrottle(
    level: LogLevel,
    logMethod: (this: LoggerService, message: any, ...optionalParams: any[]) => void,
    message: any,
    ...optionalParams: any[]
  ): void {
    const context = optionalParams.length > 0 ? String(optionalParams[0]) : undefined;
    const signature = this.generateSignature(level, message, context);

    if (this.shouldLog(signature, level)) {
      const formattedMessage = this.formatMessage(signature, message);

      // If message is a string, we added count to the message
      // If message is an object/error, add count to context to preserve error structure
      if (typeof message === "string" || optionalParams.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        logMethod.call(this.wrappedLogger, formattedMessage, ...optionalParams);
      } else {
        // For complex messages (errors, objects), preserve structure and add count to context
        const formattedContext = this.formatContext(signature, context);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const newParams = [...optionalParams];
        if (newParams.length > 0) {
          newParams[0] = formattedContext;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        logMethod.call(this.wrappedLogger, formattedMessage, ...newParams);
      }

      this.updateCache(signature, level, message, context, true);
    } else {
      this.updateCache(signature, level, message, context, false);
    }
  }

  /**
   * Write a 'log' level log.
   */
  log(message: any, ...optionalParams: any[]): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.logWithThrottle("log", this.wrappedLogger.log.bind(this.wrappedLogger), message, ...optionalParams);
  }

  /**
   * Write an 'error' level log.
   */
  error(message: any, ...optionalParams: any[]): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.logWithThrottle("error", this.wrappedLogger.error.bind(this.wrappedLogger), message, ...optionalParams);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.logWithThrottle("warn", this.wrappedLogger.warn.bind(this.wrappedLogger), message, ...optionalParams);
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: any, ...optionalParams: any[]): void {
    if (this.wrappedLogger.debug) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.logWithThrottle("debug", this.wrappedLogger.debug.bind(this.wrappedLogger), message, ...optionalParams);
    }
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: any, ...optionalParams: any[]): void {
    if (this.wrappedLogger.verbose) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.logWithThrottle("verbose", this.wrappedLogger.verbose.bind(this.wrappedLogger), message, ...optionalParams);
    }
  }

  /**
   * Write a 'fatal' level log.
   */
  fatal(message: any, ...optionalParams: any[]): void {
    if (this.wrappedLogger.fatal) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.logWithThrottle("fatal", this.wrappedLogger.fatal.bind(this.wrappedLogger), message, ...optionalParams);
    }
  }

  /**
   * Set log levels (delegates to wrapped logger).
   */
  setLogLevels(levels: LogLevel[]): void {
    if (this.wrappedLogger.setLogLevels) {
      this.wrappedLogger.setLogLevels(levels);
    }
  }

  /**
   * Get throttle statistics (useful for debugging)
   */
  getStats(): { cacheSize: number; entries: ThrottleEntry[] } {
    return {
      cacheSize: this.throttleCache.size,
      entries: Array.from(this.throttleCache.values()),
    };
  }

  /**
   * Clear throttle cache (useful for testing)
   */
  clearCache(): void {
    this.throttleCache.clear();
  }

  /**
   * Cleanup interval on service destruction
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
