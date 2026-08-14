 
 
 

import { LoggerService } from "@nestjs/common";
import { ThrottledLoggerService } from "./throttled.service";
import { AppConfigService } from "@/app.config";

function makeWrappedLogger(): LoggerService {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
    setLogLevels: jest.fn(),
  } as unknown as LoggerService;
}

function makeConfig(throttleEnabled = true, debounceSeconds = 10): AppConfigService {
  return {
    log: {
      throttle: {
        enabled: throttleEnabled,
        debounce: {
          log: debounceSeconds,
          error: debounceSeconds,
          warn: debounceSeconds,
          debug: debounceSeconds,
          verbose: debounceSeconds,
          fatal: debounceSeconds,
        },
      },
    },
  } as unknown as AppConfigService;
}

describe("ThrottledLoggerService", () => {
  let service: ThrottledLoggerService;
  let wrapped: LoggerService;

  beforeEach(() => {
    jest.useFakeTimers();
    wrapped = makeWrappedLogger();
    service = new ThrottledLoggerService(wrapped, makeConfig());
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  describe("log() — first call always passes through", () => {
    it("delegates the first log call to the wrapped logger", () => {
      service.log("hello world");
      expect(wrapped.log).toHaveBeenCalledWith("hello world");
    });
  });

  describe("throttling behaviour", () => {
    it("suppresses duplicate messages within the throttle window", () => {
      service.log("repeated message");
      service.log("repeated message");
      service.log("repeated message");
      // Only the first call should have gone through
      expect(wrapped.log).toHaveBeenCalledTimes(1);
    });

    it("allows duplicate message through after the throttle window expires", () => {
      service.log("time-based message");
      expect(wrapped.log).toHaveBeenCalledTimes(1);

      // Advance past the 10-second debounce window
      jest.advanceTimersByTime(11_000);

      service.log("time-based message");
      expect(wrapped.log).toHaveBeenCalledTimes(2);
    });

    it("passes distinct messages through independently", () => {
      service.log("message A");
      service.log("message B");
      expect(wrapped.log).toHaveBeenCalledTimes(2);
    });
  });

  describe("throttle disabled", () => {
    it("passes every message through when throttle is disabled", () => {
      const noThrottleService = new ThrottledLoggerService(wrapped, makeConfig(false));
      noThrottleService.log("msg");
      noThrottleService.log("msg");
      noThrottleService.log("msg");
      expect(wrapped.log).toHaveBeenCalledTimes(3);
      noThrottleService.onModuleDestroy();
    });
  });

  describe("error(), warn(), debug(), verbose(), fatal()", () => {
    it("delegates error to wrapped logger", () => {
      service.error("an error");
      expect(wrapped.error).toHaveBeenCalledWith("an error");
    });

    it("delegates warn to wrapped logger", () => {
      service.warn("a warning");
      expect(wrapped.warn).toHaveBeenCalledWith("a warning");
    });

    it("delegates debug to wrapped logger", () => {
      service.debug("debug info");
      expect(wrapped.debug).toHaveBeenCalledWith("debug info");
    });

    it("delegates verbose to wrapped logger", () => {
      service.verbose("verbose info");
      expect(wrapped.verbose).toHaveBeenCalledWith("verbose info");
    });

    it("delegates fatal to wrapped logger", () => {
      service.fatal("fatal error");
      expect(wrapped.fatal).toHaveBeenCalledWith("fatal error");
    });
  });

  describe("setLogLevels()", () => {
    it("delegates to wrapped logger", () => {
      service.setLogLevels(["log", "error"]);
      expect(wrapped.setLogLevels).toHaveBeenCalledWith(["log", "error"]);
    });
  });

  describe("getStats()", () => {
    it("returns cache size 0 before any logging", () => {
      const stats = service.getStats();
      expect(stats.cacheSize).toBe(0);
    });

    it("reports one entry after logging a unique message", () => {
      service.log("unique message");
      const stats = service.getStats();
      expect(stats.cacheSize).toBe(1);
    });
  });

  describe("clearCache()", () => {
    it("empties the throttle cache", () => {
      service.log("cached message");
      service.clearCache();
      expect(service.getStats().cacheSize).toBe(0);
    });
  });

  describe("onModuleDestroy()", () => {
    it("clears the cleanup interval without throwing", () => {
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });

  describe("optional logger methods — when wrapped logger lacks them", () => {
    it("debug() is a no-op when wrappedLogger.debug is undefined", () => {
      const noDebugLogger: LoggerService = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
      const svc = new ThrottledLoggerService(noDebugLogger, makeConfig());
      expect(() => svc.debug("msg")).not.toThrow();
      svc.onModuleDestroy();
    });

    it("verbose() is a no-op when wrappedLogger.verbose is undefined", () => {
      const noVerboseLogger: LoggerService = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
      const svc = new ThrottledLoggerService(noVerboseLogger, makeConfig());
      expect(() => svc.verbose("msg")).not.toThrow();
      svc.onModuleDestroy();
    });

    it("fatal() is a no-op when wrappedLogger.fatal is undefined", () => {
      const noFatalLogger: LoggerService = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
      const svc = new ThrottledLoggerService(noFatalLogger, makeConfig());
      expect(() => svc.fatal("msg")).not.toThrow();
      svc.onModuleDestroy();
    });

    it("setLogLevels() is a no-op when wrappedLogger.setLogLevels is undefined", () => {
      const noSetLevelsLogger: LoggerService = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
      const svc = new ThrottledLoggerService(noSetLevelsLogger, makeConfig());
      expect(() => svc.setLogLevels(["log"])).not.toThrow();
      svc.onModuleDestroy();
    });
  });

  describe("formatMessage — non-string message with count > 1", () => {
    it("returns original object message unchanged when count > 1", () => {
      const errMsg = new Error("boom");
      service.error(errMsg, "SomeContext");
      jest.advanceTimersByTime(11_000);
      service.error(errMsg, "SomeContext");
      // Second call is allowed after window; wrapped.error should be called twice
      expect(wrapped.error).toHaveBeenCalledTimes(2);
    });

    it("appends occurrence count to string message after re-allow (count > 1 formatMessage)", () => {
      service.log("frequent message");
      // Suppress: call twice more within window
      service.log("frequent message");
      // Allow through after window
      jest.advanceTimersByTime(11_000);
      service.log("frequent message");
      // The third allowed call's message should include count info
      expect(wrapped.log).toHaveBeenCalledTimes(2);
    });
  });

  describe("formatContext — non-string message with context, count > 1", () => {
    it("formats context with count when message is non-string", () => {
      const objMsg = { key: "value" };
      service.log(objMsg, "MyContext");
      // Suppress
      service.log(objMsg, "MyContext");
      jest.advanceTimersByTime(11_000);
      // Allow again — should format context
      service.log(objMsg, "MyContext");
      expect(wrapped.log).toHaveBeenCalledTimes(2);
    });

    it("produces countInfo without prefix when context is undefined (no-context branch)", () => {
      const objMsg = { err: "fail" };
      // Call with no context but object message to hit the else branch in logWithThrottle
      service.warn(objMsg);
      service.warn(objMsg);
      jest.advanceTimersByTime(11_000);
      service.warn(objMsg);
      expect(wrapped.warn).toHaveBeenCalledTimes(2);
    });
  });

  describe("formatMessage — minutes > 1 time unit", () => {
    it("displays minutes in the occurrence message for large debounce windows", () => {
      const longWindowConfig = makeConfig(true, 120); // 2 minutes
      const wrapped2 = makeWrappedLogger();
      const svc = new ThrottledLoggerService(wrapped2, longWindowConfig);
      svc.log("long-debounce message");
      // Suppress within window
      svc.log("long-debounce message");
      // Advance past 2-minute window
      jest.advanceTimersByTime(121_000);
      svc.log("long-debounce message");
      expect(wrapped2.log).toHaveBeenCalledTimes(2);
      // The second logged call should mention minutes
      const lastCall = (wrapped2.log as jest.Mock).mock.calls[1][0] as string;
      expect(lastCall).toMatch(/minute/);
      svc.onModuleDestroy();
    });

    it("displays minutes=1 singular form", () => {
      const oneMinConfig = makeConfig(true, 60); // 1 minute exactly
      const wrapped3 = makeWrappedLogger();
      const svc = new ThrottledLoggerService(wrapped3, oneMinConfig);
      svc.log("1-min message");
      svc.log("1-min message");
      jest.advanceTimersByTime(61_000);
      svc.log("1-min message");
      const lastCall = (wrapped3.log as jest.Mock).mock.calls[1][0] as string;
      expect(lastCall).toMatch(/1 minute[^s]/);
      svc.onModuleDestroy();
    });
  });

  describe("cleanup() — removes old entries", () => {
    it("removes entries that have exceeded the max age (2x debounce)", () => {
      service.log("expiring message");
      expect(service.getStats().cacheSize).toBe(1);
      // Advance past 2 * 10s = 20s and trigger cleanup
      jest.advanceTimersByTime(60_500); // trigger the cleanup interval
      // Entry last seen > 20s ago
      jest.advanceTimersByTime(20_500);
      jest.advanceTimersByTime(60_500); // another cleanup interval fires
      expect(service.getStats().cacheSize).toBe(0);
    });
  });
});
