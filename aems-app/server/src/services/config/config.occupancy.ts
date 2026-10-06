export type OccupiedRange = "always_on" | "always_off" | { start: string; end: string };
export type ServiceWindow = "always_on" | "always_off" | { start: string; end: string };

/** An occupancy's calendar date, YYYY-MM-DD. Dates are stored at noon UTC, so the UTC parts are the day. */
export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date, YYYY-MM-DD, in the first of TIMEZONES that names a zone, else in UTC. */
export function todayIn(timezones: (string | null | undefined)[], now = new Date()): string {
  for (const timeZone of timezones) {
    if (!timeZone) continue;
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(now)
        .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {} as Record<string, string>);
      return `${parts.year}-${parts.month}-${parts.day}`;
    } catch {
      // Not a zone Intl knows: try the next.
    }
  }
  return dateKey(now);
}

export function toMinutes(t?: string | null): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function toOccupiedRange(
  occupied?: boolean | null,
  startTime?: string | null,
  endTime?: string | null,
): OccupiedRange {
  if (!occupied) return "always_off";
  const s = toMinutes(startTime) ?? 0;
  const e = toMinutes(endTime) ?? 1440;
  if ((s === 0 || s === 1440) && (e === 0 || e === 1440)) return "always_on";
  return { start: startTime ?? "00:00", end: e === 1440 ? "23:59" : (endTime ?? "00:00") };
}

// Zero-range start === end signals "this service window is unused" — emit "always_off".
// Full-day 00:00 -> 24:00 emits "always_on" to mirror set_schedule's vocabulary.
export function toServiceWindow(startTime?: string | null, endTime?: string | null): ServiceWindow {
  const s = toMinutes(startTime);
  const e = toMinutes(endTime);
  if (s == null || e == null || s === e) return "always_off";
  if (s === 0 && e === 1440) return "always_on";
  return { start: startTime!, end: e === 1440 ? "23:59" : endTime! };
}
