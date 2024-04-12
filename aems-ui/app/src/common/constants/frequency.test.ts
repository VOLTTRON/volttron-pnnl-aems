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
    it("(purple) throws Error", () => {
      expect(() => FrequencyType.parseStrict("purple")).toThrow(Error);
    });
    it("(-1) throws Error", () => {
      expect(() => FrequencyType.parseStrict(-1)).toThrow(Error);
    });
  });
});
