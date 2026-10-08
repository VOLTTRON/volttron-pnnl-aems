/**
 * Minutes from midnight for a HH:mm string in [00:00, 24:00]; undefined for anything else.
 * Two-digit hour and minute are required; 24:00 is the only value whose minutes may be anything
 * other than 00..59 -- its minutes must be 00.
 */
export function parseScheduleTime(t: string): number | undefined {
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 24 || min < 0 || min > 59) return undefined;
  if (h === 24 && min !== 0) return undefined;
  return h * 60 + min;
}
