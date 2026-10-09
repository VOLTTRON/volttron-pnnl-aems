import { parseScheduleTime } from "./schedule";

describe("parseScheduleTime", () => {
  it("maps a valid HH:mm to minutes from midnight", () => {
    expect(parseScheduleTime("00:00")).toBe(0);
    expect(parseScheduleTime("08:30")).toBe(510);
    expect(parseScheduleTime("23:59")).toBe(23 * 60 + 59);
    expect(parseScheduleTime("24:00")).toBe(1440);
  });

  it("refuses a one-digit hour, giving undefined", () => {
    expect(parseScheduleTime("8:30")).toBeUndefined();
  });

  it("refuses minutes >= 60, giving undefined", () => {
    expect(parseScheduleTime("08:60")).toBeUndefined();
    expect(parseScheduleTime("08:99")).toBeUndefined();
  });

  it("refuses hours > 24, giving undefined", () => {
    expect(parseScheduleTime("25:00")).toBeUndefined();
    expect(parseScheduleTime("99:00")).toBeUndefined();
  });

  it("refuses 24:mm with mm != 00, giving undefined", () => {
    expect(parseScheduleTime("24:01")).toBeUndefined();
    expect(parseScheduleTime("24:30")).toBeUndefined();
  });

  it("refuses non-HH:mm shapes, giving undefined", () => {
    expect(parseScheduleTime("")).toBeUndefined();
    expect(parseScheduleTime("not-a-time")).toBeUndefined();
    expect(parseScheduleTime("08-30")).toBeUndefined();
    expect(parseScheduleTime("08:3")).toBeUndefined();
    expect(parseScheduleTime("8:03")).toBeUndefined();
    expect(parseScheduleTime("08:30:00")).toBeUndefined();
  });
});
