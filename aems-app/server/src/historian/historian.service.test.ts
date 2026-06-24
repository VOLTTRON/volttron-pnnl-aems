import { HistorianService } from "./historian.service";

describe("HistorianService.computeSetpointErrorFloorSec", () => {
  it("derives the floor from binning.start/unit/count when no override is set", () => {
    // 48h * 3600 / 500 = 345.6s -> snaps to 600s (10m)
    expect(
      HistorianService.computeSetpointErrorFloorSec({ count: 500, start: 48, unit: "hours" }),
    ).toBe(600);
  });

  it("respects the explicit override", () => {
    expect(
      HistorianService.computeSetpointErrorFloorSec({
        count: 500,
        start: 48,
        unit: "hours",
        setpointErrorMinBucket: "2m",
      }),
    ).toBe(120);
  });

  it("snaps non-aligned overrides up to the nice list", () => {
    // "45s" snaps to 60s
    expect(
      HistorianService.computeSetpointErrorFloorSec({
        count: 500,
        start: 48,
        unit: "hours",
        setpointErrorMinBucket: "45s",
      }),
    ).toBe(60);
  });

  it("supports day-unit overrides", () => {
    expect(
      HistorianService.computeSetpointErrorFloorSec({
        count: 500,
        start: 48,
        unit: "hours",
        setpointErrorMinBucket: "1d",
      }),
    ).toBe(86_400);
  });

  it("scales with smaller binning thresholds", () => {
    // 1h * 3600 / 500 = 7.2s -> snaps to 10s
    expect(
      HistorianService.computeSetpointErrorFloorSec({ count: 500, start: 1, unit: "hours" }),
    ).toBe(10);
  });

  it("scales with smaller bucket counts", () => {
    // 48h * 3600 / 100 = 1728s -> snaps to 1800s (30m)
    expect(
      HistorianService.computeSetpointErrorFloorSec({ count: 100, start: 48, unit: "hours" }),
    ).toBe(1800);
  });

  it("rejects invalid override strings", () => {
    expect(() =>
      HistorianService.computeSetpointErrorFloorSec({
        count: 500,
        start: 48,
        unit: "hours",
        setpointErrorMinBucket: "5min",
      }),
    ).toThrow(/Invalid interval format/);
  });
});
