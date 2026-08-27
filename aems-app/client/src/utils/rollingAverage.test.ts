import { rollingAverage } from "./rollingAverage";

describe("rollingAverage", () => {
  const t0 = new Date("2026-01-01T00:00:00Z").getTime();
  const at = (offsetMs: number, value: number | null) => ({
    timestamp: new Date(t0 + offsetMs),
    value,
  });

  it("returns null for the first point (single sample in window)", () => {
    const out = rollingAverage([at(0, 10)], 60_000);
    expect(out[0].value).toBeNull();
  });

  it("emits the trailing mean once two samples fit in the window", () => {
    const out = rollingAverage([at(0, 10), at(30_000, 20)], 60_000);
    expect(out[0].value).toBeNull();
    expect(out[1].value).toBeCloseTo(15);
  });

  it("drops the oldest sample when it falls outside the window", () => {
    // 60s window; points at 0, 30s, 90s. At t=90s, sample at t=0 is out.
    const out = rollingAverage([at(0, 10), at(30_000, 20), at(90_000, 30)], 60_000);
    expect(out[2].value).toBeCloseTo(25);
  });

  it("ignores null values but still counts them toward window edges", () => {
    const out = rollingAverage([at(0, 10), at(30_000, null), at(45_000, 30)], 60_000);
    expect(out[2].value).toBeCloseTo(20);
  });

  it("emits null when only one non-null value falls in the window", () => {
    const out = rollingAverage([at(0, 10), at(120_000, 20)], 60_000);
    expect(out[1].value).toBeNull();
  });

  it("throws on non-positive windowMs", () => {
    expect(() => rollingAverage([], 0)).toThrow();
    expect(() => rollingAverage([], -1)).toThrow();
  });
});
