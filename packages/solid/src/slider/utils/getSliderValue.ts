import { clamp } from '@script-augur/base-ui-utils'

import { asc } from './asc'

/**
 * Builds the next slider value after a discrete (keyboard/input) change.
 */
export function getSliderValue(
  valueInput: number,
  index: number,
  min: number,
  max: number,
  range: boolean,
  values: ReadonlyArray<number>
): number | Array<number> {
  const clamped = clamp(valueInput, min, max)

  if (!range) {
    return clamped
  }

  const output = values.slice()
  // Bound the new value to the thumb's neighbours.
  output[index] = clamp(
    clamped,
    values[index - 1] ?? -Infinity,
    values[index + 1] ?? Infinity
  )
  return output.sort(asc)
}
