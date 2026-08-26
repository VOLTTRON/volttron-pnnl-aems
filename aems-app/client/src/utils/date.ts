export function formatDate(
  value: string | Date,
  timezone: string | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = value instanceof Date ? value : new Date(value as string);
  const opts = timezone ? { ...options, timeZone: timezone } : options;
  return opts ? d.toLocaleString(undefined, opts) : d.toLocaleString();
}
