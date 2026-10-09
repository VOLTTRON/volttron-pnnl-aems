import { parseScheduleTime } from "@local/common";

const SCHEDULE_TIME_FIELDS = new Set([
  "startTime",
  "endTime",
  "overridePreStartTime",
  "overridePreEndTime",
  "overridePostStartTime",
  "overridePostEndTime",
]);

/**
 * Walks a mutation payload for schedule time fields and refuses any that is not HH:mm from
 * 00:00 to 24:00. Nested writes (prisma `create`, `update`, etc.) are walked too.
 */
export function refuseBadScheduleTimes(input: unknown): void {
  if (!input || typeof input !== "object") return;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (SCHEDULE_TIME_FIELDS.has(key) && value !== null && value !== undefined) {
      if (typeof value !== "string" || parseScheduleTime(value) === undefined) {
        throw new Error(`${key} must be HH:mm from 00:00 to 24:00, got ${JSON.stringify(value)}`);
      }
    } else if (value && typeof value === "object") {
      refuseBadScheduleTimes(value);
    }
  }
}
