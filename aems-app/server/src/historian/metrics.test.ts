import { applyTransform } from "./metrics";
import { MetricTransform } from "@local/common";

describe("applyTransform", () => {
  it("passes null through for every transform", () => {
    for (const t of Object.values(MetricTransform)) {
      expect(applyTransform(null, t)).toBeNull();
    }
  });

  it("returns non-finite inputs unchanged", () => {
    expect(applyTransform(NaN, MetricTransform.Percent)).toBeNaN();
    expect(applyTransform(Infinity, MetricTransform.Integer)).toBe(Infinity);
    expect(applyTransform(-Infinity, MetricTransform.Decimal2)).toBe(-Infinity);
  });

  describe("percent", () => {
    it("scales 0-1 values to whole-number percentages", () => {
      expect(applyTransform(0.98346, MetricTransform.Percent)).toBe(98);
      expect(applyTransform(0, MetricTransform.Percent)).toBe(0);
      expect(applyTransform(1, MetricTransform.Percent)).toBe(100);
      expect(applyTransform(0.5, MetricTransform.Percent)).toBe(50);
    });

    it("does not clamp values outside [0, 1]", () => {
      expect(applyTransform(-0.05, MetricTransform.Percent)).toBe(-5);
      expect(applyTransform(1.5, MetricTransform.Percent)).toBe(150);
      expect(applyTransform(-1.2345, MetricTransform.Percent)).toBe(-123);
    });

    it("rounds to whole numbers", () => {
      expect(applyTransform(0.126, MetricTransform.Percent)).toBe(13);
      expect(applyTransform(0.124, MetricTransform.Percent)).toBe(12);
    });
  });
});
