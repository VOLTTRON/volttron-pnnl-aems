export interface SetpointRow {
  setpoint: number;
  deadband: number;
  overrideSetpoint: number;
  overrideDeadband: number;
  heating: number;
  cooling: number;
  standbyTime: number;
  standbyOffset: number;
}

/**
 * The reason a setpoint row is invalid, or undefined if it is valid.
 * Ranges follow setpoints-schedules.md; spacing is heating + 2 + deadband/2 <= setpoint
 * <= cooling - 2 - deadband/2.
 */
export function checkSetpoint(row: SetpointRow): string | undefined {
  if (row.setpoint < 55 || row.setpoint > 85) return `setpoint must be in [55, 85]`;
  if (row.overrideSetpoint < 55 || row.overrideSetpoint > 85) return `overrideSetpoint must be in [55, 85]`;
  if (row.heating < 55 || row.heating > 85) return `heating must be in [55, 85]`;
  if (row.cooling < 55 || row.cooling > 85) return `cooling must be in [55, 85]`;
  if (row.deadband < 2 || row.deadband > 6) return `deadband must be in [2, 6]`;
  if (row.overrideDeadband < 2 || row.overrideDeadband > 10) return `overrideDeadband must be in [2, 10]`;
  if (row.standbyTime < 5 || row.standbyTime > 60) return `standbyTime must be in [5, 60]`;
  if (row.standbyOffset < 0 || row.standbyOffset > 5) return `standbyOffset must be in [0, 5]`;
  const low = row.heating + 2 + row.deadband / 2;
  const high = row.cooling - 2 - row.deadband / 2;
  if (row.setpoint < low || row.setpoint > high) {
    return `setpoint must be in [${low}, ${high}] given heating ${row.heating}, cooling ${row.cooling}, deadband ${row.deadband}`;
  }
  return undefined;
}
