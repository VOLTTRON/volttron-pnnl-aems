import { AppLoggerService } from "./logging.service";
import { AppConfigService } from "@/app.config";
import { LoggerService } from "@nestjs/common";

function makeConfig(overrides: object = {}): AppConfigService {
  return {
    log: {
      console: { level: "log" },
      throttle: { enabled: false },
    },
    instanceName: "test",
    ...overrides,
  } as unknown as AppConfigService;
}

function makeConfig_noConsole(): AppConfigService {
  return {
    log: {
      console: { level: null },
      throttle: { enabled: false },
    },
    instanceName: "test",
  } as unknown as AppConfigService;
}

function makeInnerLogger(): jest.Mocked<LoggerService> {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
    setLogLevels: jest.fn(),
  } as unknown as jest.Mocked<LoggerService>;
}

describe("AppLoggerService", () => {
  describe("construction", () => {
    it("constructs without throwing when a console level is set", () => {
      expect(() => new AppLoggerService(makeConfig())).not.toThrow();
    });

    it("constructs without throwing when no console level is set", () => {
      expect(() => new AppLoggerService(makeConfig_noConsole())).not.toThrow();
    });
  });

  describe("registerLogger()", () => {
    it("registers a new logger", () => {
      const service = new AppLoggerService(makeConfig_noConsole());
      const inner = makeInnerLogger();
      service.registerLogger(inner);
      service.log("hello");
      expect(inner.log).toHaveBeenCalledWith("hello");
    });

    it("does not register the same logger twice", () => {
      const service = new AppLoggerService(makeConfig_noConsole());
      const inner = makeInnerLogger();
      service.registerLogger(inner);
      service.registerLogger(inner);
      service.log("hello");
      expect(inner.log).toHaveBeenCalledTimes(1);
    });
  });

  describe("log methods delegate to all registered loggers", () => {
    let service: AppLoggerService;
    let inner: jest.Mocked<LoggerService>;

    beforeEach(() => {
      service = new AppLoggerService(makeConfig_noConsole());
      inner = makeInnerLogger();
      service.registerLogger(inner);
    });

    it("log() forwards to all loggers", () => {
      service.log("msg", "ctx");
      expect(inner.log).toHaveBeenCalledWith("msg", "ctx");
    });

    it("error() forwards to all loggers", () => {
      service.error("err", "trace");
      expect(inner.error).toHaveBeenCalledWith("err", "trace");
    });

    it("warn() forwards to all loggers", () => {
      service.warn("warning");
      expect(inner.warn).toHaveBeenCalledWith("warning");
    });

    it("debug() forwards to all loggers", () => {
      service.debug?.("debug");
      expect(inner.debug).toHaveBeenCalledWith("debug");
    });

    it("verbose() forwards to all loggers", () => {
      service.verbose?.("verbose");
      expect(inner.verbose).toHaveBeenCalledWith("verbose");
    });

    it("fatal() forwards to all loggers", () => {
      service.fatal?.("fatal");
      expect(inner.fatal).toHaveBeenCalledWith("fatal");
    });

    it("setLogLevels() forwards to all loggers", () => {
      service.setLogLevels?.(["log", "warn"]);
      expect(inner.setLogLevels).toHaveBeenCalledWith(["log", "warn"]);
    });
  });

  describe("multiple registered loggers", () => {
    it("dispatches to all of them", () => {
      const service = new AppLoggerService(makeConfig_noConsole());
      const a = makeInnerLogger();
      const b = makeInnerLogger();
      service.registerLogger(a);
      service.registerLogger(b);
      service.log("broadcast");
      expect(a.log).toHaveBeenCalled();
      expect(b.log).toHaveBeenCalled();
    });
  });
});
