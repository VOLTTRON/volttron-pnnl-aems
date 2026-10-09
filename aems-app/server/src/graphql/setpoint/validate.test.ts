import { refuseBadSetpoint, refuseBadNestedSetpoints, SETPOINT_DEFAULTS } from "./validate";

describe("refuseBadSetpoint", () => {
  it("accepts an empty input against defaults", () => {
    expect(() => refuseBadSetpoint({})).not.toThrow();
  });

  it("refuses a top-level setpoint = 100 as a partial update over valid current", () => {
    expect(() => refuseBadSetpoint({ setpoint: 100 }, SETPOINT_DEFAULTS)).toThrow();
  });

  it("refuses a non-numeric input", () => {
    expect(() => refuseBadSetpoint({ setpoint: "hot" })).toThrow();
  });

  it("refuses a spacing break the partial update introduces over the current row", () => {
    // current heating=60, cooling=80, setpoint=70, deadband=4; valid.
    // Raise heating to 70; the resulting row violates heating + 2 + 2 <= 70, so 70 < 74 refused.
    expect(() => refuseBadSetpoint({ heating: 70 }, { ...SETPOINT_DEFAULTS })).toThrow();
  });

  it("accepts a null/undefined field (left unchanged)", () => {
    expect(() => refuseBadSetpoint({ setpoint: null, cooling: undefined })).not.toThrow();
  });
});

describe("refuseBadNestedSetpoints", () => {
  it("refuses a nested create's out-of-range setpoint", () => {
    expect(() =>
      refuseBadNestedSetpoints({ setpoint: { create: { setpoint: 100 } } }),
    ).toThrow();
  });

  it("refuses a nested update's out-of-range deadband given CURRENT from the parent", () => {
    expect(() =>
      refuseBadNestedSetpoints(
        { setpoint: { update: { deadband: 10 } } },
        () => SETPOINT_DEFAULTS,
      ),
    ).toThrow();
  });

  it("accepts a well-formed nested update", () => {
    expect(() =>
      refuseBadNestedSetpoints(
        { setpoint: { update: { setpoint: 72 } } },
        () => SETPOINT_DEFAULTS,
      ),
    ).not.toThrow();
  });

  it("tolerates no setpoint field at all", () => {
    expect(() => refuseBadNestedSetpoints({ label: "L" })).not.toThrow();
  });

  it("walks into a nested schedule write to find a setpoint inside it", () => {
    expect(() =>
      refuseBadNestedSetpoints({
        mondaySchedule: { create: { setpoint: { create: { setpoint: 100 } } } },
      }),
    ).toThrow();
  });
});
