export function formatDate(value: string | Date, timezone: string | undefined): string {
  const d = value instanceof Date ? value : new Date(value as string);
  if (!timezone || timezone === "none") return d.toLocaleString();
  const tz = timezone === "browser" ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone;
  return d.toLocaleString(undefined, { timeZone: tz });
}
