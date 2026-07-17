export type OccupiedRange = "always_on" | "always_off" | { start: string; end: string };
export type ServiceWindow = "always_on" | "always_off" | { start: string; end: string };

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
