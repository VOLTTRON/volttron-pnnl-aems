// Canonical year for constructing a Date from a stored month/day pair
// (custom holidays store no year). Must remain a leap year so that Feb 29
// stays representable — do not "modernize" this to the current year.
export const LEAP_YEAR = 2024;

export function formatDate(
  value: string | Date,
  timezone: string | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = value instanceof Date ? value : new Date(value as string);
  const opts = timezone ? { ...options, timeZone: timezone } : options;
  return opts ? d.toLocaleString(undefined, opts) : d.toLocaleString();
}

// Service-anchored calendar day (e.g. Occupancy.date) storage convention:
// Store noon-UTC of the intended day so that getUTC{FullYear,Month,Date}
// returns the intended day AND any realistic display timezone (UTC-11..+13)
// renders the intended day. The server (config.service.ts) already reads only
// UTC calendar components to build the day key it hands to Volttron.

export function calendarDayToISO(day: string): string {
  if (!day) return "";
  return `${day}T12:00:00.000Z`;
}

export function isoToCalendarDay(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function todayInZone(timezone: string | undefined): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const g = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])) as Record<
    string,
    string
  >;
  return `${g.year}-${g.month}-${g.day}`;
}
