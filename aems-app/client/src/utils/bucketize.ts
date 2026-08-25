export interface BucketizePoint {
  timestamp: Date | string | number;
  value: number | null;
}

export interface BoxplotBucket {
  midMs: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
}

/**
 * Group a time-sorted point series into `boxCount` equal-width time buckets
 * over `[startMs, endMs]` and compute a 5-number summary per bucket.
 *
 * Buckets with fewer than `minSamplesPerBox` non-null values are omitted from
 * the result so ECharts renders a gap rather than a degenerate box. Percentiles
 * use nearest-rank on a sorted copy of each bucket's values — no interpolation.
 *
 * Points are assumed to be sorted by timestamp ascending; a two-pointer sweep
 * keeps this O(n log n) where the log term is the per-bucket sort.
 */
export function bucketize(
  points: BucketizePoint[],
  startMs: number,
  endMs: number,
  boxCount: number,
  minSamplesPerBox = 3,
): BoxplotBucket[] {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return [];
  if (!Number.isFinite(boxCount) || boxCount < 1) return [];

  const width = (endMs - startMs) / boxCount;
  const buckets: number[][] = Array.from({ length: boxCount }, () => []);

  let cursor = 0;
  for (const p of points) {
    const t = timestampToMs(p.timestamp);
    if (!Number.isFinite(t)) continue;
    if (t < startMs || t > endMs) continue;
    if (typeof p.value !== "number" || !Number.isFinite(p.value)) continue;
    // Compute bucket index from time. Clamp end-inclusive edge into the last bucket.
    let idx = Math.floor((t - startMs) / width);
    if (idx >= boxCount) idx = boxCount - 1;
    if (idx < cursor) cursor = idx;
    buckets[idx].push(p.value);
  }

  const out: BoxplotBucket[] = [];
  for (let i = 0; i < boxCount; i++) {
    const values = buckets[i];
    if (values.length < minSamplesPerBox) continue;
    values.sort((a, b) => a - b);
    out.push({
      midMs: startMs + width * (i + 0.5),
      min: values[0],
      q1: nearestRank(values, 0.25),
      median: nearestRank(values, 0.5),
      q3: nearestRank(values, 0.75),
      max: values[values.length - 1],
      count: values.length,
    });
  }
  return out;
}

function timestampToMs(t: Date | string | number): number {
  if (t instanceof Date) return t.getTime();
  if (typeof t === "number") return t;
  return new Date(t).getTime();
}

// Nearest-rank percentile: given a sorted ascending array, return the value at
// ceil(q * n) - 1 (i.e. the smallest element whose rank cumulative frequency
// is >= q). Simple, deterministic, and doesn't interpolate — matches how a
// visual quartile splits a small sample.
function nearestRank(sorted: number[], q: number): number {
  const n = sorted.length;
  const rank = Math.max(1, Math.ceil(q * n));
  return sorted[Math.min(rank - 1, n - 1)];
}
