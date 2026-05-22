/**
 * Build ECharts yAxis `min`/`max` callbacks that pad the data range by `padding`
 * (a fraction of the data range). The padding is what gives the brush/dataZoom
 * select-drag empty space above and below the lines, so the user can start a
 * drag without landing exactly on a series point.
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
      return min - (span === 0 ? 1 : span * padding);
    },
    max: ({ min, max }) => {
      if (!isFinite(min) || !isFinite(max)) return 1;
      const span = max - min;
      return max + (span === 0 ? 1 : span * padding);
    },
  };
}
