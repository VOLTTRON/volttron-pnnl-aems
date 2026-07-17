 
 
 

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
});
