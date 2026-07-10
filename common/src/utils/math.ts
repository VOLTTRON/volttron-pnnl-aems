/**
 * Linear Interpolation
 * @param min
 * @param max
 * @param a normalized value
 * @returns value between min and max for a
 */
export const lerp = (min: number, max: number, a: number): number => min * (1 - a) + max * a;

/**
 * Clamp
 * @param a value between min and max
 * @param min
 * @param max
 * @returns value clamped between min and max
 */
export const clamp = (a: number, min = 0, max = 1): number => Math.min(max, Math.max(min, a));

/**
 * Inverse Linear Interpolation
 * @param min
 * @param max
 * @param a value between min and max
 * @returns normalized value between x and y for a
 */
export const invlerp = (min: number, max: number, a: number): number => clamp((a - min) / (max - min));

/**
 * Maps a value from one numeric range to another.
 * @param aMin input range min
 * @param aMax input range max
 * @param rMin output range min
 * @param rMax output range max
 * @param a value within input range
 * @returns value mapped to output range
 */
export const range = (aMin: number, aMax: number, rMin: number, rMax: number, a: number): number =>
  aMin === aMax ? rMax : lerp(rMin, rMax, invlerp(aMin, aMax, a));
