/**
 * Build ECharts yAxis `min`/`max` callbacks that pad the data range by `padding`
 * (a fraction of the data range), then snap the padded ends to the nearest
 * "nice" step (1, 2, or 5 × 10^k) so the axis starts and ends on round numbers
 * instead of long decimals like 71.234567.
 *
 * The padding is what gives the brush/dataZoom select-drag empty space above
 * and below the lines, so the user can start a drag without landing exactly
 * on a series point.
 *
 * Falls back to ±1 when the data is flat (max === min) or absent, so the axis
 * still has a usable range.
 */
export function paddedRange(padding = 0.15): {
  min: (value: { min: number; max: number }) => number;
  max: (value: { min: number; max: number }) => number;
} {
  return {
    min: ({ min, max }) => {
      if (!isFinite(min) || !isFinite(max)) return 0;
      const span = max - min;
      const effectiveSpan = span === 0 ? 1 : span;
      const padded = min - effectiveSpan * padding;
      return snap(padded, niceStep(effectiveSpan), Math.floor);
    },
    max: ({ min, max }) => {
      if (!isFinite(min) || !isFinite(max)) return 1;
      const span = max - min;
      const effectiveSpan = span === 0 ? 1 : span;
      const padded = max + effectiveSpan * padding;
      return snap(padded, niceStep(effectiveSpan), Math.ceil);
    },
  };
}

/**
 * Pick a "nice" step (1, 2, or 5 × 10^k) such that the span is divided into
 * roughly 5 increments. Keeps axis tick labels short across orders of magnitude.
 */
function niceStep(span: number): number {
  const rough = span / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;
  if (normalized < 1.5) return 1 * magnitude;
  if (normalized < 3) return 2 * magnitude;
  if (normalized < 7) return 5 * magnitude;
  return 10 * magnitude;
}

/** Floor/ceil to a multiple of `step`, then trim float-multiplication noise. */
function snap(value: number, step: number, fn: (v: number) => number): number {
  const snapped = fn(value / step) * step;
  const decimals = step >= 1 ? 0 : Math.min(20, Math.ceil(-Math.log10(step)));
  return parseFloat(snapped.toFixed(decimals));
}
