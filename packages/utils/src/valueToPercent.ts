/**
 * Converts a value within `[min, max]` to a percentage of that range.
 *
 * @param value - Current value.
 * @param min - Range minimum.
 * @param max - Range maximum.
 * @returns Percentage in the 0–100 scale (not clamped).
 */
export function valueToPercent(
  value: number,
  min: number,
  max: number
): number {
  return ((value - min) * 100) / (max - min)
}
