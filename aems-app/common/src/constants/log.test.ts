/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { LogType } from "../";

describe("constants.LogType", () => {
  describe("LogType.parse()", () => {
    it("(trace) is trace", () => {
      expect(LogType.parse("trace")?.name).toEqual("trace");
    });
    it("(Trace) is trace", () => {
      expect(LogType.parse("Trace")?.name).toEqual("trace");
    });
    it("(debug) is debug", () => {
      expect(LogType.parse("debug")?.name).toEqual("debug");
    });
    it("(Debug) is debug", () => {
      expect(LogType.parse("Debug")?.name).toEqual("debug");
    });
    it("(info) is info", () => {
      expect(LogType.parse("info")?.name).toEqual("info");
    });
    it("(Info) is info", () => {
      expect(LogType.parse("Info")?.name).toEqual("info");
    });
    it("(warn) is warn", () => {
      expect(LogType.parse("warn")?.name).toEqual("warn");
    });
    it("(Warn) is warn", () => {
      expect(LogType.parse("Warn")?.name).toEqual("warn");
    });
    it("(error) is error", () => {
      expect(LogType.parse("error")?.name).toEqual("error");
    });
    it("(Error) is error", () => {
      expect(LogType.parse("Error")?.name).toEqual("error");
    });
    it("(fatal) is fatal", () => {
      expect(LogType.parse("fatal")?.name).toEqual("fatal");
    });
    it("(Fatal) is fatal", () => {
      expect(LogType.parse("Fatal")?.name).toEqual("fatal");
    });
    it("(0) is trace", () => {
      expect(LogType.parse(0)?.name).toEqual("trace");
    });
    it("(1) is debug", () => {
      expect(LogType.parse(1)?.name).toEqual("debug");
    });
    it("(2) is info", () => {
      expect(LogType.parse(2)?.name).toEqual("info");
    });
    it("(3) is warn", () => {
      expect(LogType.parse(3)?.name).toEqual("warn");
    });
    it("(4) is error", () => {
      expect(LogType.parse(4)?.name).toEqual("error");
    });
    it("(5) is fatal", () => {
      expect(LogType.parse(5)?.name).toEqual("fatal");
    });
    it("(object with name) is parsed correctly", () => {
      expect(LogType.parse({ name: "error" } as any)?.name).toEqual("error");
    });
    it("(invalid string) is undefined", () => {
      expect(LogType.parse("invalid-level")).toBeUndefined();
    });
    it("(invalid number) is undefined", () => {
      expect(LogType.parse(99)).toBeUndefined();
    });
  });

  describe("LogType.parseStrict()", () => {
    it("(trace) is trace", () => {
      expect(LogType.parseStrict("trace")?.name).toEqual("trace");
    });
    it("(debug) is debug", () => {
      expect(LogType.parseStrict("debug")?.name).toEqual("debug");
    });
    it("(info) is info", () => {
      expect(LogType.parseStrict("info")?.name).toEqual("info");
    });
    it("(warn) is warn", () => {
      expect(LogType.parseStrict("warn")?.name).toEqual("warn");
    });
    it("(error) is error", () => {
      expect(LogType.parseStrict("error")?.name).toEqual("error");
    });
    it("(fatal) is fatal", () => {
      expect(LogType.parseStrict("fatal")?.name).toEqual("fatal");
    });
    it("(0) is trace", () => {
      expect(LogType.parseStrict(0)?.name).toEqual("trace");
    });
    it("(5) is fatal", () => {
      expect(LogType.parseStrict(5)?.name).toEqual("fatal");
    });
    it("(invalid string) throws Error", () => {
      expect(() => LogType.parseStrict("invalid-level")).toThrow(Error);
    });
    it("(invalid number) throws Error", () => {
      expect(() => LogType.parseStrict(99)).toThrow(Error);
    });
    it("(null) throws Error", () => {
      expect(() => LogType.parseStrict(null as any)).toThrow(Error);
    });
    it("(undefined) throws Error", () => {
      expect(() => LogType.parseStrict(undefined as any)).toThrow(Error);
    });
  });

  describe("LogType static references", () => {
    it("Trace should have correct properties", () => {
      expect(LogType.Trace.name).toEqual("trace");
      expect(LogType.Trace.label).toEqual("Trace");
      expect(LogType.Trace.enum).toEqual("Trace");
      expect(LogType.Trace.level).toEqual("10");
    });
    it("TraceType should be same as Trace", () => {
      expect(LogType.TraceType).toEqual(LogType.Trace);
    });
    it("Debug should have correct properties", () => {
      expect(LogType.Debug.name).toEqual("debug");
      expect(LogType.Debug.label).toEqual("Debug");
      expect(LogType.Debug.enum).toEqual("Debug");
      expect(LogType.Debug.level).toEqual("20");
    });
    it("DebugType should be same as Debug", () => {
      expect(LogType.DebugType).toEqual(LogType.Debug);
    });
    it("Info should have correct properties", () => {
      expect(LogType.Info.name).toEqual("info");
      expect(LogType.Info.label).toEqual("Info");
      expect(LogType.Info.enum).toEqual("Info");
      expect(LogType.Info.level).toEqual("30");
    });
    it("InfoType should be same as Info", () => {
      expect(LogType.InfoType).toEqual(LogType.Info);
    });
    it("Warn should have correct properties", () => {
      expect(LogType.Warn.name).toEqual("warn");
      expect(LogType.Warn.label).toEqual("Warn");
      expect(LogType.Warn.enum).toEqual("Warn");
      expect(LogType.Warn.level).toEqual("40");
    });
    it("WarnType should be same as Warn", () => {
      expect(LogType.WarnType).toEqual(LogType.Warn);
    });
    it("Error should have correct properties", () => {
      expect(LogType.Error.name).toEqual("error");
      expect(LogType.Error.label).toEqual("Error");
      expect(LogType.Error.enum).toEqual("Error");
      expect(LogType.Error.level).toEqual("50");
    });
    it("ErrorType should be same as Error", () => {
      expect(LogType.ErrorType).toEqual(LogType.Error);
    });
    it("Fatal should have correct properties", () => {
      expect(LogType.Fatal.name).toEqual("fatal");
      expect(LogType.Fatal.label).toEqual("Fatal");
      expect(LogType.Fatal.enum).toEqual("Fatal");
      expect(LogType.Fatal.level).toEqual("60");
    });
    it("FatalType should be same as Fatal", () => {
      expect(LogType.FatalType).toEqual(LogType.Fatal);
    });
  });

  describe("LogType level hierarchy", () => {
    it("should have correct level ordering", () => {
      const levels = [LogType.Trace, LogType.Debug, LogType.Info, LogType.Warn, LogType.Error, LogType.Fatal];
      const levelValues = levels.map(l => parseInt(l.level));
      expect(levelValues).toEqual([10, 20, 30, 40, 50, 60]);
    });
    it("should have ascending level values", () => {
      expect(parseInt(LogType.Trace.level)).toBeLessThan(parseInt(LogType.Debug.level));
      expect(parseInt(LogType.Debug.level)).toBeLessThan(parseInt(LogType.Info.level));
      expect(parseInt(LogType.Info.level)).toBeLessThan(parseInt(LogType.Warn.level));
      expect(parseInt(LogType.Warn.level)).toBeLessThan(parseInt(LogType.Error.level));
      expect(parseInt(LogType.Error.level)).toBeLessThan(parseInt(LogType.Fatal.level));
    });
  });

  describe("LogType edge cases", () => {
    it("should handle all enum values", () => {
      expect(LogType.Trace.enum).toEqual("Trace");
      expect(LogType.Debug.enum).toEqual("Debug");
      expect(LogType.Info.enum).toEqual("Info");
      expect(LogType.Warn.enum).toEqual("Warn");
      expect(LogType.Error.enum).toEqual("Error");
      expect(LogType.Fatal.enum).toEqual("Fatal");
    });
    it("should have immutable static references", () => {
      expect(LogType.Trace).toBeDefined();
      expect(LogType.Debug).toBeDefined();
      expect(LogType.Info).toBeDefined();
      expect(LogType.Warn).toBeDefined();
      expect(LogType.Error).toBeDefined();
      expect(LogType.Fatal).toBeDefined();
    });
  });

  describe("LogType iteration", () => {
    it("should be iterable", () => {
      const levels = [...LogType];
      expect(levels.length).toEqual(6);
      expect(levels[0]).toHaveProperty("name");
      expect(levels[0]).toHaveProperty("label");
      expect(levels[0]).toHaveProperty("enum");
      expect(levels[0]).toHaveProperty("level");
    });
    it("should have correct length", () => {
      expect(LogType.length).toEqual(6);
    });
    it("should iterate in correct order", () => {
      const names = [...LogType].map(l => l.name);
      expect(names).toEqual(["trace", "debug", "info", "warn", "error", "fatal"]);
    });
  });

  describe("LogType constants access", () => {
    it("should access constants by name", () => {
      expect(LogType.constants["trace"]).toBeDefined();
      expect(LogType.constants["debug"]).toBeDefined();
      expect(LogType.constants["info"]).toBeDefined();
      expect(LogType.constants["warn"]).toBeDefined();
      expect(LogType.constants["error"]).toBeDefined();
      expect(LogType.constants["fatal"]).toBeDefined();
    });
    it("should access constants by label", () => {
      expect(LogType.constants["Trace"]).toBeDefined();
      expect(LogType.constants["Debug"]).toBeDefined();
      expect(LogType.constants["Info"]).toBeDefined();
      expect(LogType.constants["Warn"]).toBeDefined();
      expect(LogType.constants["Error"]).toBeDefined();
      expect(LogType.constants["Fatal"]).toBeDefined();
    });
  });

  describe("LogType matcher", () => {
    it("should have default matcher", () => {
      expect(LogType.matcher).toBeDefined();
      expect(typeof LogType.matcher).toBe("function");
    });
    it("should allow custom matcher", () => {
      const originalMatcher = LogType.matcher;
      LogType.matcher = (v) => v.toLowerCase();
      expect(LogType.parse("TRACE")?.name).toEqual("trace");
      expect(LogType.parse("ERROR")?.name).toEqual("error");
      LogType.matcher = originalMatcher;
    });
  });

  describe("LogType level comparison utilities", () => {
    it("should support level comparison by numeric value", () => {
      const isErrorOrHigher = (level: string) => parseInt(level) >= parseInt(LogType.Error.level);
      expect(isErrorOrHigher(LogType.Trace.level)).toBe(false);
      expect(isErrorOrHigher(LogType.Debug.level)).toBe(false);
      expect(isErrorOrHigher(LogType.Info.level)).toBe(false);
      expect(isErrorOrHigher(LogType.Warn.level)).toBe(false);
      expect(isErrorOrHigher(LogType.Error.level)).toBe(true);
      expect(isErrorOrHigher(LogType.Fatal.level)).toBe(true);
    });
  });
});
