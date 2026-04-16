import Frequency from "./frequency";

describe("Frequency", () => {
  describe("parse", () => {
    it("should parse frequency by name", () => {
      expect(Frequency.parse("second")?.name).toBe("second");
      expect(Frequency.parse("minute")?.name).toBe("minute");
      expect(Frequency.parse("hour")?.name).toBe("hour");
      expect(Frequency.parse("day")?.name).toBe("day");
      expect(Frequency.parse("week")?.name).toBe("week");
      expect(Frequency.parse("month")?.name).toBe("month");
      expect(Frequency.parse("year")?.name).toBe("year");
    });

    it("should parse frequency by abbreviation", () => {
      expect(Frequency.parse("ms")?.name).toBe("millisecond");
      expect(Frequency.parse("s")?.name).toBe("second");
      expect(Frequency.parse("m")?.name).toBe("minute");
      expect(Frequency.parse("h")?.name).toBe("hour");
      expect(Frequency.parse("d")?.name).toBe("day");
      expect(Frequency.parse("w")?.name).toBe("week");
      expect(Frequency.parse("mo")?.name).toBe("month");
      expect(Frequency.parse("y")?.name).toBe("year");
    });

    it("should parse frequency case-insensitively", () => {
      expect(Frequency.parse("S")?.name).toBe("second");
      expect(Frequency.parse("M")?.name).toBe("minute");
      expect(Frequency.parse("H")?.name).toBe("hour");
      expect(Frequency.parse("D")?.name).toBe("day");
    });
  });

  describe("milliseconds property", () => {
    it("should have correct millisecond values", () => {
      expect(Frequency.Millisecond.milliseconds).toBe(1);
      expect(Frequency.Second.milliseconds).toBe(1000);
      expect(Frequency.Minute.milliseconds).toBe(60 * 1000);
      expect(Frequency.Hour.milliseconds).toBe(60 * 60 * 1000);
      expect(Frequency.Day.milliseconds).toBe(24 * 60 * 60 * 1000);
      expect(Frequency.Week.milliseconds).toBe(7 * 24 * 60 * 60 * 1000);
      expect(Frequency.Month.milliseconds).toBe(30 * 24 * 60 * 60 * 1000);
      expect(Frequency.Year.milliseconds).toBe(365.25 * 24 * 60 * 60 * 1000);
    });
  });

  describe("convert static method", () => {
    it("should convert seconds to milliseconds", () => {
      expect(Frequency.convert("second", 1, "millisecond")).toBe(1000);
      expect(Frequency.convert("second", 5, "millisecond")).toBe(5000);
    });

    it("should convert minutes to seconds", () => {
      expect(Frequency.convert("minute", 1, "second")).toBe(60);
      expect(Frequency.convert("minute", 2, "second")).toBe(120);
    });

    it("should convert hours to minutes", () => {
      expect(Frequency.convert("hour", 1, "minute")).toBe(60);
      expect(Frequency.convert("hour", 2, "minute")).toBe(120);
    });

    it("should convert days to hours", () => {
      expect(Frequency.convert("day", 1, "hour")).toBe(24);
      expect(Frequency.convert("day", 2, "hour")).toBe(48);
    });

    it("should convert weeks to days", () => {
      expect(Frequency.convert("week", 1, "day")).toBe(7);
      expect(Frequency.convert("week", 2, "day")).toBe(14);
    });

    it("should convert months to days (approximate)", () => {
      expect(Frequency.convert("month", 1, "day")).toBe(30);
      expect(Frequency.convert("month", 2, "day")).toBe(60);
    });

    it("should convert years to days (approximate)", () => {
      expect(Frequency.convert("year", 1, "day")).toBe(365.25);
      expect(Frequency.convert("year", 2, "day")).toBe(730.5);
    });

    it("should convert days to weeks", () => {
      expect(Frequency.convert("day", 7, "week")).toBe(1);
      expect(Frequency.convert("day", 14, "week")).toBe(2);
    });

    it("should convert hours to days", () => {
      expect(Frequency.convert("hour", 24, "day")).toBe(1);
      expect(Frequency.convert("hour", 48, "day")).toBe(2);
    });

    it("should convert minutes to hours", () => {
      expect(Frequency.convert("minute", 60, "hour")).toBe(1);
      expect(Frequency.convert("minute", 120, "hour")).toBe(2);
    });

    it("should convert seconds to minutes", () => {
      expect(Frequency.convert("second", 60, "minute")).toBe(1);
      expect(Frequency.convert("second", 120, "minute")).toBe(2);
    });

    it("should convert milliseconds to seconds", () => {
      expect(Frequency.convert("millisecond", 1000, "second")).toBe(1);
      expect(Frequency.convert("millisecond", 5000, "second")).toBe(5);
    });

    it("should handle same-unit conversions", () => {
      expect(Frequency.convert("day", 5, "day")).toBe(5);
      expect(Frequency.convert("hour", 10, "hour")).toBe(10);
    });

    it("should work with IFrequency objects", () => {
      expect(Frequency.convert(Frequency.Day, 1, Frequency.Hour)).toBe(24);
      expect(Frequency.convert(Frequency.Week, 1, Frequency.Day)).toBe(7);
    });

    it("should work with abbreviations", () => {
      expect(Frequency.convert("d", 1, "h")).toBe(24);
      expect(Frequency.convert("h", 24, "d")).toBe(1);
      expect(Frequency.convert("w", 1, "d")).toBe(7);
    });

    it("should handle complex conversions", () => {
      // 1 week to milliseconds
      expect(Frequency.convert("week", 1, "millisecond")).toBe(7 * 24 * 60 * 60 * 1000);
      
      // 30 days to weeks (approximately 4.29 weeks)
      expect(Frequency.convert("day", 30, "week")).toBeCloseTo(4.285714, 5);
      
      // 1 year to hours
      expect(Frequency.convert("year", 1, "hour")).toBe(365.25 * 24);
    });
  });

  describe("edge cases", () => {
    it("should handle zero values", () => {
      expect(Frequency.convert("day", 0, "hour")).toBe(0);
      expect(Frequency.convert("second", 0, "millisecond")).toBe(0);
    });

    it("should handle decimal values", () => {
      expect(Frequency.convert("hour", 1.5, "minute")).toBe(90);
      expect(Frequency.convert("day", 0.5, "hour")).toBe(12);
    });

    it("should throw error for invalid frequency", () => {
      expect(() => Frequency.convert("invalid", 1, "day")).toThrow();
      expect(() => Frequency.convert("day", 1, "invalid")).toThrow();
    });
  });
});
