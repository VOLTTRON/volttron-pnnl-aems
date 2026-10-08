import { checkSetpoint, SetpointRow } from "@local/common";

export const SETPOINT_DEFAULTS: SetpointRow = {
  setpoint: 70,
  deadband: 4,
  overrideSetpoint: 70,
  overrideDeadband: 4,
  heating: 60,
  cooling: 80,
  standbyTime: 15,
  standbyOffset: 2,
};

const FIELDS: (keyof SetpointRow)[] = [
  "setpoint",
  "deadband",
  "overrideSetpoint",
  "overrideDeadband",
  "heating",
  "cooling",
  "standbyTime",
  "standbyOffset",
];

/**
 * Refuses if the row the write would leave -- CURRENT with INPUT overlaid, Prisma defaults filling
 * anything neither has -- breaks a rule from setpoints-schedules.md. A numeric field in INPUT that
 * is not a number is itself a refusal. CURRENT = null means a fresh row.
 */
export function refuseBadSetpoint(
  input: Record<string, unknown>,
  current: Partial<SetpointRow> | null = null,
): void {
  const row: SetpointRow = { ...SETPOINT_DEFAULTS, ...(current ?? {}) };
  for (const field of FIELDS) {
    const v = input[field];
    if (v === undefined || v === null) continue;
    if (typeof v !== "number" || Number.isNaN(v)) {
      throw new Error(`${field} must be a number, got ${JSON.stringify(v)}`);
    }
    (row as unknown as Record<string, number>)[field] = v;
  }
  const reason = checkSetpoint(row);
  if (reason) throw new Error(reason);
}

/**
 * Walks a mutation payload for nested `setpoint: { create }` and `setpoint: { update }` writes
 * and refuses each. A nested update's CURRENT is looked up through RESOLVE_CURRENT, which the
 * resolver supplies when it has already fetched the parent row.
 */
export function refuseBadNestedSetpoints(
  input: unknown,
  resolveCurrent: () => Partial<SetpointRow> | null = () => null,
): void {
  if (!input || typeof input !== "object") return;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (key === "setpoint" && value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      if (nested.create && typeof nested.create === "object") {
        refuseBadSetpoint(nested.create as Record<string, unknown>, null);
      }
      if (nested.update && typeof nested.update === "object") {
        refuseBadSetpoint(nested.update as Record<string, unknown>, resolveCurrent());
      }
    } else if (value && typeof value === "object") {
      refuseBadNestedSetpoints(value, resolveCurrent);
    }
  }
}
