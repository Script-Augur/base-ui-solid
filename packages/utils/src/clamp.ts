/**
 * Clamps a number to the inclusive range `[min, max]`.
 *
 * @param value - Input number.
 * @param min - Lower bound (inclusive).
 * @param max - Upper bound (inclusive).
 * @returns `value` constrained to `[min, max]`.
 *
 * @example
 * ```ts
 * import { clamp } from "@script-augur/base-ui-utils"
 *
 * clamp(120, 0, 100) // 100
 * clamp(-5, 0, 100) // 0
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}
