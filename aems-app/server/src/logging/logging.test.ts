import { getLogLevel, getLogLevels, InfoLogger, LogLevels } from "./index";

describe("Logging Module", () => {
  describe("getLogLevel", () => {
    it("should return correct log level for valid inputs", () => {
      expect(getLogLevel("fatal")).toBe("fatal");
      expect(getLogLevel("error")).toBe("error");
      expect(getLogLevel("warn")).toBe("warn");
      expect(getLogLevel("log")).toBe("log");
      expect(getLogLevel("info")).toBe("log");
      expect(getLogLevel("debug")).toBe("debug");
      expect(getLogLevel("verbose")).toBe("verbose");
      expect(getLogLevel("trace")).toBe("verbose");
    });

    it("should handle case insensitive inputs", () => {
      expect(getLogLevel("FATAL")).toBe("fatal");
      expect(getLogLevel("ERROR")).toBe("error");
      expect(getLogLevel("WARN")).toBe("warn");
      expect(getLogLevel("LOG")).toBe("log");
      expect(getLogLevel("INFO")).toBe("log");
      expect(getLogLevel("DEBUG")).toBe("debug");
      expect(getLogLevel("VERBOSE")).toBe("verbose");
      expect(getLogLevel("TRACE")).toBe("verbose");
    });

    it("should handle inputs with whitespace", () => {
      expect(getLogLevel("  fatal  ")).toBe("fatal");
      expect(getLogLevel("\terror\t")).toBe("error");
      expect(getLogLevel("\nwarn\n")).toBe("warn");
    });

    it("should return undefined for invalid inputs", () => {
      expect(getLogLevel("invalid")).toBeUndefined();
      expect(getLogLevel("")).toBeUndefined();
      expect(getLogLevel("unknown")).toBeUndefined();
      expect(getLogLevel("123")).toBeUndefined();
    });

    it("should handle mixed case inputs", () => {
      expect(getLogLevel("Fatal")).toBe("fatal");
      expect(getLogLevel("ErRoR")).toBe("error");
      expect(getLogLevel("WaRn")).toBe("warn");
      expect(getLogLevel("InFo")).toBe("log");
    });

    it("should handle special characters", () => {
      expect(getLogLevel("log!")).toBeUndefined();
      expect(getLogLevel("@error")).toBeUndefined();
      expect(getLogLevel("warn#")).toBeUndefined();
    });
  });

  describe("getLogLevels", () => {
    it("should return correct log levels array for fatal", () => {
      const levels = getLogLevels("fatal");
      expect(levels).toEqual(["fatal"]);
    });

    it("should return correct log levels array for error", () => {
      const levels = getLogLevels("error");
      expect(levels).toEqual(["fatal", "error"]);
    });

    it("should return correct log levels array for warn", () => {
      const levels = getLogLevels("warn");
      expect(levels).toEqual(["fatal", "error", "warn"]);
    });

    it("should return correct log levels array for log", () => {
      const levels = getLogLevels("log");
      expect(levels).toEqual(["fatal", "error", "warn", "log"]);
    });

    it("should return correct log levels array for info", () => {
      const levels = getLogLevels("info");
      expect(levels).toEqual(["fatal", "error", "warn", "log"]);
    });

    it("should return correct log levels array for debug", () => {
      const levels = getLogLevels("debug");
      expect(levels).toEqual(["fatal", "error", "warn", "log", "debug"]);
    });

    it("should return correct log levels array for verbose", () => {
      const levels = getLogLevels("verbose");
      expect(levels).toEqual(["fatal", "error", "warn", "log", "debug", "verbose"]);
    });

    it("should return correct log levels array for trace", () => {
      const levels = getLogLevels("trace");
      expect(levels).toEqual(["fatal", "error", "warn", "log", "debug", "verbose"]);
    });

    it("should handle case insensitive inputs", () => {
      const levels = getLogLevels("ERROR");
      expect(levels).toEqual(["fatal", "error"]);
    });

    it("should handle inputs with whitespace", () => {
      const levels = getLogLevels("  warn  ");
      expect(levels).toEqual(["fatal", "error", "warn"]);
    });

    it("should throw error for invalid log level", () => {
      expect(() => getLogLevels("invalid")).toThrow("Invalid log level: invalid");
    });

    it("should throw error for empty string", () => {
      expect(() => getLogLevels("")).toThrow("Invalid log level: ");
    });

    it("should throw error for undefined input", () => {
      expect(() => getLogLevels("undefined")).toThrow("Invalid log level: undefined");
    });
  });

  describe("LogLevels constant", () => {
    it("should contain all expected log levels in correct order", () => {
      expect(LogLevels).toEqual(["fatal", "error", "warn", "log", "debug", "verbose"]);
    });

    it("should be an array of LogLevel types", () => {
      LogLevels.forEach(level => {
        expect(typeof level).toBe("string");
        expect(["fatal", "error", "warn", "log", "debug", "verbose"]).toContain(level);
      });
    });

    it("should have correct length", () => {
      expect(LogLevels).toHaveLength(6);
    });
  });

  describe("InfoLogger", () => {
    let infoLogger: InfoLogger;

    beforeEach(() => {
      infoLogger = new InfoLogger();
    });

    it("should create InfoLogger instance", () => {
      expect(infoLogger).toBeInstanceOf(InfoLogger);
    });

    it("should have info method", () => {
      expect(typeof infoLogger.info).toBe("function");
    });

    it("should handle info call with message only", () => {
      expect(() => infoLogger.info("Test info message")).not.toThrow();
    });

    it("should handle info call with message and context", () => {
      expect(() => infoLogger.info("Test info message", "TestContext")).not.toThrow();
    });

    it("should handle info call with message and optional params", () => {
      expect(() => infoLogger.info("Test message", "param1", "param2", "TestContext")).not.toThrow();
    });

    it("should handle info call with no parameters", () => {
      expect(() => infoLogger.info("")).not.toThrow();
    });

    it("should handle info call with null message", () => {
      expect(() => infoLogger.info(null as any)).not.toThrow();
    });

    it("should handle info call with undefined message", () => {
      expect(() => infoLogger.info(undefined as any)).not.toThrow();
    });

    it("should handle info call with object message", () => {
      const objectMessage = { key: "value", nested: { prop: "test" } };
      expect(() => infoLogger.info(objectMessage)).not.toThrow();
    });

    it("should handle info call with array message", () => {
      const arrayMessage = ["item1", "item2", "item3"];
      expect(() => infoLogger.info(arrayMessage)).not.toThrow();
    });

    it("should handle info call with number message", () => {
      const numberMessage = 12345;
      expect(() => infoLogger.info(numberMessage)).not.toThrow();
    });

    it("should handle info call with boolean message", () => {
      const booleanMessage = true;
      expect(() => infoLogger.info(booleanMessage)).not.toThrow();
    });

    it("should handle info call with mixed parameter types", () => {
      const message = "Test message";
      const stringParam = "string";
      const numberParam = 123;
      const objectParam = { key: "value" };
      const context = "TestContext";

      expect(() => infoLogger.info(message, stringParam, numberParam, objectParam, context)).not.toThrow();
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle getLogLevel with special unicode characters", () => {
      expect(getLogLevel("érror")).toBeUndefined();
      expect(getLogLevel("wärn")).toBeUndefined();
      expect(getLogLevel("lög")).toBeUndefined();
    });

    it("should handle getLogLevel with numeric strings", () => {
      expect(getLogLevel("0")).toBeUndefined();
      expect(getLogLevel("1")).toBeUndefined();
      expect(getLogLevel("123")).toBeUndefined();
    });

    it("should handle getLogLevels with boundary cases", () => {
      // Test with the first level
      expect(getLogLevels("fatal")).toEqual(["fatal"]);
      
      // Test with the last level
      expect(getLogLevels("verbose")).toEqual(LogLevels);
    });

    it("should handle InfoLogger inheritance", () => {
      const infoLogger = new InfoLogger();
      
      // Should inherit from Logger
      expect(infoLogger).toHaveProperty('log');
      expect(infoLogger).toHaveProperty('error');
      expect(infoLogger).toHaveProperty('warn');
      expect(infoLogger).toHaveProperty('debug');
      expect(infoLogger).toHaveProperty('verbose');
      expect(infoLogger).toHaveProperty('info');
    });

    it("should handle very long log messages", () => {
      const infoLogger = new InfoLogger();
      
      const longMessage = "a".repeat(10000);
      expect(() => infoLogger.info(longMessage)).not.toThrow();
    });

    it("should handle complex nested objects in log messages", () => {
      const infoLogger = new InfoLogger();
      
      const complexObj = {
        name: "test",
        nested: {
          level1: {
            level2: {
              value: "deep value"
            }
          }
        },
        array: [1, 2, { nested: "array item" }]
      };
      
      expect(() => infoLogger.info(complexObj)).not.toThrow();
    });
  });
});
