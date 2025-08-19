/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { FrequencyType } from "../";

describe("constants.FrequencyType", () => {
  describe("FrequencyType.parse()", () => {
    it("(hour) is hour", () => {
      expect(FrequencyType.parse("hour")?.name).toEqual("hour");
    });
    it("(Second) is second", () => {
      expect(FrequencyType.parse("Second")?.name).toEqual("second");
    });
    it("(D) is day", () => {
      expect(FrequencyType.parse("D")?.name).toEqual("day");
    });
    it("(m) is minute", () => {
      expect(FrequencyType.parse("m")?.name).toEqual("minute");
    });
    it("(s) is second", () => {
      expect(FrequencyType.parse("s")?.name).toEqual("second");
    });
    it("(S) is second", () => {
      expect(FrequencyType.parse("S")?.name).toEqual("second");
    });
    it("(M) is minute", () => {
      expect(FrequencyType.parse("M")?.name).toEqual("minute");
    });
    it("(h) is hour", () => {
      expect(FrequencyType.parse("h")?.name).toEqual("hour");
    });
    it("(H) is hour", () => {
      expect(FrequencyType.parse("H")?.name).toEqual("hour");
    });
    it("(d) is day", () => {
      expect(FrequencyType.parse("d")?.name).toEqual("day");
    });
    it("(0) is second", () => {
      expect(FrequencyType.parse(0)?.name).toEqual("second");
    });
    it("(1) is minute", () => {
      expect(FrequencyType.parse(1)?.name).toEqual("minute");
    });
    it("(2) is hour", () => {
      expect(FrequencyType.parse(2)?.name).toEqual("hour");
    });
    it("(3) is day", () => {
      expect(FrequencyType.parse(3)?.name).toEqual("day");
    });
    it("(object with name) is parsed correctly", () => {
      expect(FrequencyType.parse({ name: "hour" } as any)?.name).toEqual("hour");
    });
    it("(invalid string) is undefined", () => {
      expect(FrequencyType.parse("invalid-frequency")).toBeUndefined();
    });
    it("(invalid number) is undefined", () => {
      expect(FrequencyType.parse(99)).toBeUndefined();
    });
  });

  describe("FrequencyType.parseStrict()", () => {
    it("(hour) is hour", () => {
      expect(FrequencyType.parseStrict("hour")?.name).toEqual("hour");
    });
    it("(Second) is second", () => {
      expect(FrequencyType.parseStrict("Second")?.name).toEqual("second");
    });
    it("(D) is day", () => {
      expect(FrequencyType.parseStrict("D")?.name).toEqual("day");
    });
    it("(m) is minute", () => {
      expect(FrequencyType.parseStrict("m")?.name).toEqual("minute");
    });
    it("(s) is second", () => {
      expect(FrequencyType.parseStrict("s")?.name).toEqual("second");
    });
    it("(S) is second", () => {
      expect(FrequencyType.parseStrict("S")?.name).toEqual("second");
    });
    it("(M) is minute", () => {
      expect(FrequencyType.parseStrict("M")?.name).toEqual("minute");
    });
    it("(h) is hour", () => {
      expect(FrequencyType.parseStrict("h")?.name).toEqual("hour");
    });
    it("(H) is hour", () => {
      expect(FrequencyType.parseStrict("H")?.name).toEqual("hour");
    });
    it("(d) is day", () => {
      expect(FrequencyType.parseStrict("d")?.name).toEqual("day");
    });
    it("(0) is second", () => {
      expect(FrequencyType.parseStrict(0)?.name).toEqual("second");
    });
    it("(3) is day", () => {
      expect(FrequencyType.parseStrict(3)?.name).toEqual("day");
    });
    it("(purple) throws Error", () => {
      expect(() => FrequencyType.parseStrict("purple")).toThrow(Error);
    });
    it("(-1) throws Error", () => {
      expect(() => FrequencyType.parseStrict(-1)).toThrow(Error);
    });
    it("(null) throws Error", () => {
      expect(() => FrequencyType.parseStrict(null as any)).toThrow(Error);
    });
    it("(undefined) throws Error", () => {
      expect(() => FrequencyType.parseStrict(undefined as any)).toThrow(Error);
    });
  });

  describe("FrequencyType static references", () => {
    it("Second should have correct properties", () => {
      expect(FrequencyType.Second.name).toEqual("second");
      expect(FrequencyType.Second.label).toEqual("Second");
      expect(FrequencyType.Second.abbr).toEqual("s");
      expect(FrequencyType.Second.plural).toEqual("seconds");
      expect(FrequencyType.Second.pattern.postgres).toEqual("YYYY-MM-DD HH24:mm:ss");
      expect(FrequencyType.Second.pattern.mysql).toEqual("%Y-%m-%d %H:%i:%s");
    });
    it("SecondType should be same as Second", () => {
      expect(FrequencyType.SecondType).toEqual(FrequencyType.Second);
    });
    it("Minute should have correct properties", () => {
      expect(FrequencyType.Minute.name).toEqual("minute");
      expect(FrequencyType.Minute.label).toEqual("Minute");
      expect(FrequencyType.Minute.abbr).toEqual("m");
      expect(FrequencyType.Minute.plural).toEqual("minutes");
      expect(FrequencyType.Minute.pattern.postgres).toEqual("YYYY-MM-DD HH24:mm");
      expect(FrequencyType.Minute.pattern.mysql).toEqual("%Y-%m-%d %H:%i");
    });
    it("MinuteType should be same as Minute", () => {
      expect(FrequencyType.MinuteType).toEqual(FrequencyType.Minute);
    });
    it("Hour should have correct properties", () => {
      expect(FrequencyType.Hour.name).toEqual("hour");
      expect(FrequencyType.Hour.label).toEqual("Hour");
      expect(FrequencyType.Hour.abbr).toEqual("h");
      expect(FrequencyType.Hour.plural).toEqual("hours");
      expect(FrequencyType.Hour.pattern.postgres).toEqual("YYYY-MM-DD HH24");
      expect(FrequencyType.Hour.pattern.mysql).toEqual("%Y-%m-%d %H");
    });
    it("HourType should be same as Hour", () => {
      expect(FrequencyType.HourType).toEqual(FrequencyType.Hour);
    });
    it("Day should have correct properties", () => {
      expect(FrequencyType.Day.name).toEqual("day");
      expect(FrequencyType.Day.label).toEqual("Day");
      expect(FrequencyType.Day.abbr).toEqual("d");
      expect(FrequencyType.Day.plural).toEqual("days");
      expect(FrequencyType.Day.pattern.postgres).toEqual("YYYY-MM-DD");
      expect(FrequencyType.Day.pattern.mysql).toEqual("%Y-%m-%d");
    });
    it("DayType should be same as Day", () => {
      expect(FrequencyType.DayType).toEqual(FrequencyType.Day);
    });
  });

  describe("FrequencyType edge cases", () => {
    it("should handle all abbreviations", () => {
      expect(FrequencyType.Second.abbr).toEqual("s");
      expect(FrequencyType.Minute.abbr).toEqual("m");
      expect(FrequencyType.Hour.abbr).toEqual("h");
      expect(FrequencyType.Day.abbr).toEqual("d");
    });
    it("should handle all plural forms", () => {
      expect(FrequencyType.Second.plural).toEqual("seconds");
      expect(FrequencyType.Minute.plural).toEqual("minutes");
      expect(FrequencyType.Hour.plural).toEqual("hours");
      expect(FrequencyType.Day.plural).toEqual("days");
    });
    it("should have immutable static references", () => {
      expect(FrequencyType.Second).toBeDefined();
      expect(FrequencyType.Minute).toBeDefined();
      expect(FrequencyType.Hour).toBeDefined();
      expect(FrequencyType.Day).toBeDefined();
    });
  });

  describe("FrequencyType iteration", () => {
    it("should be iterable", () => {
      const frequencies = [...FrequencyType];
      expect(frequencies.length).toEqual(4);
      expect(frequencies[0]).toHaveProperty("name");
      expect(frequencies[0]).toHaveProperty("label");
      expect(frequencies[0]).toHaveProperty("abbr");
      expect(frequencies[0]).toHaveProperty("plural");
      expect(frequencies[0]).toHaveProperty("pattern");
    });
    it("should have correct length", () => {
      expect(FrequencyType.length).toEqual(4);
    });
    it("should iterate in correct order", () => {
      const names = [...FrequencyType].map(f => f.name);
      expect(names).toEqual(["second", "minute", "hour", "day"]);
    });
  });

  describe("FrequencyType constants access", () => {
    it("should access constants by name", () => {
      expect(FrequencyType.constants["second"]).toBeDefined();
      expect(FrequencyType.constants["minute"]).toBeDefined();
      expect(FrequencyType.constants["hour"]).toBeDefined();
      expect(FrequencyType.constants["day"]).toBeDefined();
    });
    it("should access constants by label", () => {
      expect(FrequencyType.constants["Second"]).toBeDefined();
      expect(FrequencyType.constants["Minute"]).toBeDefined();
      expect(FrequencyType.constants["Hour"]).toBeDefined();
      expect(FrequencyType.constants["Day"]).toBeDefined();
    });
  });

  describe("FrequencyType matcher", () => {
    it("should have custom matcher for abbreviations", () => {
      expect(FrequencyType.matcher).toBeDefined();
      expect(typeof FrequencyType.matcher).toBe("function");
    });
    it("should handle abbreviation matching", () => {
      expect(FrequencyType.matcher("s")).toEqual("second");
      expect(FrequencyType.matcher("S")).toEqual("second");
      expect(FrequencyType.matcher("m")).toEqual("minute");
      expect(FrequencyType.matcher("M")).toEqual("minute");
      expect(FrequencyType.matcher("h")).toEqual("hour");
      expect(FrequencyType.matcher("H")).toEqual("hour");
      expect(FrequencyType.matcher("d")).toEqual("day");
      expect(FrequencyType.matcher("D")).toEqual("day");
      expect(FrequencyType.matcher("other")).toEqual("other");
    });
  });

  describe("FrequencyType database patterns", () => {
    it("should have postgres patterns for all frequencies", () => {
      expect(FrequencyType.Second.pattern.postgres).toBeDefined();
      expect(FrequencyType.Minute.pattern.postgres).toBeDefined();
      expect(FrequencyType.Hour.pattern.postgres).toBeDefined();
      expect(FrequencyType.Day.pattern.postgres).toBeDefined();
    });
    it("should have mysql patterns for all frequencies", () => {
      expect(FrequencyType.Second.pattern.mysql).toBeDefined();
      expect(FrequencyType.Minute.pattern.mysql).toBeDefined();
      expect(FrequencyType.Hour.pattern.mysql).toBeDefined();
      expect(FrequencyType.Day.pattern.mysql).toBeDefined();
    });
    it("should have different patterns for different databases", () => {
      expect(FrequencyType.Second.pattern.postgres).not.toEqual(FrequencyType.Second.pattern.mysql);
      expect(FrequencyType.Minute.pattern.postgres).not.toEqual(FrequencyType.Minute.pattern.mysql);
      expect(FrequencyType.Hour.pattern.postgres).not.toEqual(FrequencyType.Hour.pattern.mysql);
      expect(FrequencyType.Day.pattern.postgres).not.toEqual(FrequencyType.Day.pattern.mysql);
    });
  });
});
