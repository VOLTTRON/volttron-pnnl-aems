export interface RollingPoint {
  timestamp: Date | string;
  value: number | null;
}

export interface RollingResult {
  timestamp: Date;
  value: number | null;
}

/**
 * Trailing rolling average over a time-based window. For each input point at
 * time `t`, emits the mean of all non-null values in `[t - windowMs, t]`.
 * Requires at least 2 non-null samples inside the window to emit a value —
 * otherwise emits `null`, which ECharts renders as a break in the line.
 *
 * Input points are assumed to be in ascending timestamp order; timestamps
 * may be Date instances or ISO strings. Runs in O(n) via two-pointer sweep.
 */
export function rollingAverage(points: RollingPoint[], windowMs: number): RollingResult[] {
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new Error(`rollingAverage: windowMs must be a positive finite number, got ${windowMs}`);
  }
  const times: number[] = new Array(points.length);
  const values: (number | null)[] = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    times[i] = p.timestamp instanceof Date ? p.timestamp.getTime() : new Date(p.timestamp).getTime();
    values[i] = typeof p.value === "number" && Number.isFinite(p.value) ? p.value : null;
  }
  const out: RollingResult[] = new Array(points.length);
  let sum = 0;
  let count = 0;
  let left = 0;
  for (let right = 0; right < points.length; right++) {
    const rv = values[right];
    if (rv !== null) {
      sum += rv;
      count += 1;
    }
    const windowStart = times[right] - windowMs;
    while (left <= right && times[left] < windowStart) {
      const lv = values[left];
      if (lv !== null) {
        sum -= lv;
        count -= 1;
      }
      left += 1;
    }
    out[right] = {
      timestamp: new Date(times[right]),
      value: count >= 2 ? sum / count : null,
    };
  }
  return out;
}
