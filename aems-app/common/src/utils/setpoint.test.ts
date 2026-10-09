import { checkSetpoint, SetpointRow } from "./setpoint";

const valid: SetpointRow = {
  setpoint: 70,
  deadband: 4,
  overrideSetpoint: 72,
  overrideDeadband: 6,
  heating: 60,
  cooling: 80,
  standbyTime: 30,
  standbyOffset: 2,
};

describe("checkSetpoint", () => {
  it("returns undefined for a row that satisfies every rule", () => {
    expect(checkSetpoint(valid)).toBeUndefined();
  });

  describe("range checks", () => {
    const cases: Array<[keyof SetpointRow, number]> = [
      ["setpoint", 54],
      ["setpoint", 86],
      ["overrideSetpoint", 54],
      ["overrideSetpoint", 86],
      ["heating", 54],
      ["heating", 86],
      ["cooling", 54],
      ["cooling", 86],
      ["deadband", 1],
      ["deadband", 7],
      ["overrideDeadband", 1],
      ["overrideDeadband", 11],
      ["standbyTime", 4],
      ["standbyTime", 61],
      ["standbyOffset", -1],
      ["standbyOffset", 6],
    ];
    it.each(cases)("refuses %s = %s", (field, value) => {
      expect(checkSetpoint({ ...valid, [field]: value })).toBeDefined();
    });
  });

  it("refuses a setpoint below heating + 2 + deadband/2", () => {
    expect(checkSetpoint({ ...valid, heating: 70, deadband: 4, setpoint: 73 })).toBeDefined();
  });

  it("refuses a setpoint above cooling - 2 - deadband/2", () => {
    expect(checkSetpoint({ ...valid, cooling: 70, deadband: 4, setpoint: 67 })).toBeDefined();
  });

  it("accepts the spacing boundaries exactly", () => {
    expect(checkSetpoint({ ...valid, heating: 60, deadband: 4, setpoint: 64 })).toBeUndefined();
    expect(checkSetpoint({ ...valid, cooling: 80, deadband: 4, setpoint: 76 })).toBeUndefined();
  });
});
