import { refuseBadScheduleTimes } from "./validate";

describe("refuseBadScheduleTimes", () => {
  it("accepts a payload with every time field set to a valid HH:mm", () => {
    expect(() =>
      refuseBadScheduleTimes({
        startTime: "08:00",
        endTime: "17:00",
        overridePreStartTime: "06:00",
        overridePreEndTime: "08:00",
        overridePostStartTime: "17:00",
        overridePostEndTime: "19:00",
      }),
    ).not.toThrow();
  });

  it("accepts the endpoints 00:00 and 24:00", () => {
    expect(() => refuseBadScheduleTimes({ startTime: "00:00", endTime: "24:00" })).not.toThrow();
  });

  it.each([
    ["startTime", "8:00"],
    ["endTime", "25:00"],
    ["overridePreStartTime", "24:30"],
    ["overridePreEndTime", "ab:cd"],
    ["overridePostStartTime", "08:60"],
    ["overridePostEndTime", "08-00"],
  ])("refuses %s = %s", (field, value) => {
    expect(() => refuseBadScheduleTimes({ [field]: value })).toThrow();
  });

  it("refuses a nested schedule write under a Prisma `create`", () => {
    expect(() =>
      refuseBadScheduleTimes({
        mondaySchedule: { create: { startTime: "99:99" } },
      }),
    ).toThrow();
  });

  it("refuses a nested schedule write under a Prisma `update`", () => {
    expect(() =>
      refuseBadScheduleTimes({
        tuesdaySchedule: { update: { endTime: "25:00" } },
      }),
    ).toThrow();
  });

  it("tolerates a null or undefined time field", () => {
    expect(() => refuseBadScheduleTimes({ startTime: null })).not.toThrow();
    expect(() => refuseBadScheduleTimes({ startTime: undefined })).not.toThrow();
  });

  it("tolerates a non-object input", () => {
    expect(() => refuseBadScheduleTimes(null)).not.toThrow();
    expect(() => refuseBadScheduleTimes(undefined)).not.toThrow();
    expect(() => refuseBadScheduleTimes("x")).not.toThrow();
  });
});
