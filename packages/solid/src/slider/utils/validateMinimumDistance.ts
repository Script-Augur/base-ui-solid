/**
 * Whether consecutive values in a range satisfy `minStepsBetweenValues * step`.
 */
export function validateMinimumDistance(
  values: number | ReadonlyArray<number>,
  step: number,
  minStepsBetweenValues: number
): boolean {
  if (!Array.isArray(values)) {
    return true
  }

  const minDistance = step * minStepsBetweenValues
  for (let i = 0; i < values.length - 1; i += 1) {
    if (!(Math.abs(values[i]! - values[i + 1]!) >= minDistance)) {
      return false
    }
  }
  return true
}
