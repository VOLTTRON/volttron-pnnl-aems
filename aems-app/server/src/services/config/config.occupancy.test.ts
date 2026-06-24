import { Schedule } from "@prisma/client";
import { toMinutes, toOccupiedRange, toServiceWindow } from "./config.occupancy";

describe("toMinutes", () => {
  test.each([
    ["00:00", 0],
    ["24:00", 1440],
    ["08:30", 510],
    ["8:05", 485],
  ])("parses %s to %i", (input, expected) => {
    expect(toMinutes(input)).toBe(expected);
  });

  test.each([
    [null, null],
    [undefined, null],
    ["", null],
    ["bad", null],
    ["12:3", null],
  ])("returns null for invalid input %p", (input, expected) => {
    expect(toMinutes(input)).toBe(expected);
  });
});

describe("toOccupiedRange", () => {
  test("returns always_off when occupied is false", () => {
    expect(toOccupiedRange(false, "08:00", "18:00")).toBe("always_off");
  });

  test("returns always_off when occupied is null/undefined", () => {
    expect(toOccupiedRange(null, null, null)).toBe("always_off");
    expect(toOccupiedRange(undefined, "08:00", "18:00")).toBe("always_off");
  });

  test("returns always_on for full-day 00:00 -> 24:00", () => {
    expect(toOccupiedRange(true, "00:00", "24:00")).toBe("always_on");
  });

  test("returns always_on for legacy 00:00 -> 00:00 midnight-boundary equivalence", () => {
    expect(toOccupiedRange(true, "00:00", "00:00")).toBe("always_on");
  });

  test("returns always_on for 24:00 -> 24:00", () => {
    expect(toOccupiedRange(true, "24:00", "24:00")).toBe("always_on");
  });

  test("returns range for normal start/end", () => {
    expect(toOccupiedRange(true, "08:00", "18:00")).toEqual({ start: "08:00", end: "18:00" });
  });

  test("regression: 00:00 -> 18:00 is NOT always_on", () => {
    expect(toOccupiedRange(true, "00:00", "18:00")).toEqual({ start: "00:00", end: "18:00" });
  });

  test("clamps trailing 24:00 to 23:59 because the edge rejects hour 24", () => {
    expect(toOccupiedRange(true, "08:00", "24:00")).toEqual({ start: "08:00", end: "23:59" });
  });
});

describe("toServiceWindow", () => {
  test("zero-range 00:00 -> 00:00 is always_off (the bug)", () => {
    expect(toServiceWindow("00:00", "00:00")).toBe("always_off");
  });

  test("zero-range 24:00 -> 24:00 is always_off (the bug)", () => {
    expect(toServiceWindow("24:00", "24:00")).toBe("always_off");
  });

  test("full-day 00:00 -> 24:00 is always_on (vocabulary parity with set_schedule)", () => {
    expect(toServiceWindow("00:00", "24:00")).toBe("always_on");
  });

  test("returns range for normal start/end", () => {
    expect(toServiceWindow("06:00", "08:00")).toEqual({ start: "06:00", end: "08:00" });
  });

  test("clamps trailing 24:00 to 23:59", () => {
    expect(toServiceWindow("18:00", "24:00")).toEqual({ start: "18:00", end: "23:59" });
  });

  test("returns always_off when either bound is missing", () => {
    expect(toServiceWindow(null, null)).toBe("always_off");
    expect(toServiceWindow(undefined, "08:00")).toBe("always_off");
    expect(toServiceWindow("08:00", undefined)).toBe("always_off");
  });
});

// Integration: lock the buildOccupancyPayload contract by calling the helpers in
// the same shape ConfigService.buildOccupancyPayload uses.
describe("buildOccupancyPayload contract", () => {
  function build(schedule: Partial<Schedule>) {
    return {
      occupancy: toOccupiedRange(schedule.occupied, schedule.startTime, schedule.endTime),
      override: {
        pre: toServiceWindow(schedule.overridePreStartTime, schedule.overridePreEndTime),
        post: toServiceWindow(schedule.overridePostStartTime, schedule.overridePostEndTime),
      },
    };
  }

  test("occupied day with unused pre and configured post", () => {
    expect(
      build({
        occupied: true,
        startTime: "08:00",
        endTime: "18:00",
        override: true,
        overridePreStartTime: "00:00",
        overridePreEndTime: "00:00",
        overridePostStartTime: "16:00",
        overridePostEndTime: "18:00",
      }),
    ).toEqual({
      occupancy: { start: "08:00", end: "18:00" },
      override: { pre: "always_off", post: { start: "16:00", end: "18:00" } },
    });
  });

  test("unoccupied day still emits its configured service windows (override flag is UI-only)", () => {
    expect(
      build({
        occupied: false,
        override: false,
        overridePreStartTime: "06:00",
        overridePreEndTime: "08:00",
        overridePostStartTime: "24:00",
        overridePostEndTime: "24:00",
      }),
    ).toEqual({
      occupancy: "always_off",
      override: { pre: { start: "06:00", end: "08:00" }, post: "always_off" },
    });
  });
});
