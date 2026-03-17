/**
 * Parse a time range string (e.g., "3h", "7d") into milliseconds
 */
export function parseTimeRange(range: string): number {
  const value = parseInt(range);
  const unit = range.replace(/\d+/, '');

  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 3 * 60 * 60 * 1000; // Default 3 hours
  }
}

/**
 * Calculate time range based on from/to dates or current time
 */
export function calculateTimeRange(
  fromDate: Date,
  toDate: Date | null,
  useCurrentTime: boolean
): { startTime: string; endTime: string } {
  const endDateTime = useCurrentTime || !toDate ? new Date() : toDate;
  
  return {
    startTime: fromDate.toISOString(),
    endTime: endDateTime.toISOString(),
  };
}

/**
 * Validate that the from date is before the to date
 */
export function validateDateRange(fromDate: Date, toDate: Date | null): boolean {
  if (!toDate) return true; // If no end date, always valid (using current time)
  return fromDate < toDate;
}

/**
 * Calculate from date based on a preset time range string
 */
export function calculateFromDateForPreset(preset: string): Date {
  const now = new Date();
  const milliseconds = parseTimeRange(preset);
  return new Date(now.getTime() - milliseconds);
}
