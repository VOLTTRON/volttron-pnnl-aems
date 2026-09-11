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
