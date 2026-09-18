/** Attribute that opts an element out of toast swipe dismiss. */
export const BASE_UI_SWIPE_IGNORE_ATTRIBUTE = 'data-base-ui-swipe-ignore'
/** Legacy swipe-ignore attribute. */
export const LEGACY_SWIPE_IGNORE_ATTRIBUTE = 'data-swipe-ignore'
/** Selector for Base UI swipe-ignore. */
export const BASE_UI_SWIPE_IGNORE_SELECTOR = `[${BASE_UI_SWIPE_IGNORE_ATTRIBUTE}]`
/** Selector for legacy swipe-ignore. */
export const LEGACY_SWIPE_IGNORE_SELECTOR = `[${LEGACY_SWIPE_IGNORE_ATTRIBUTE}]`
/**
 * Signed displacement along a swipe dismiss direction.
 *
 * @param direction - Swipe axis direction.
 * @param deltaX - Horizontal pointer delta.
 * @param deltaY - Vertical pointer delta.
 * @returns Positive when moving in `direction`.
 */
export function getDisplacement(
  direction: 'up' | 'down' | 'left' | 'right',
  deltaX: number,
  deltaY: number
): number {
  switch (direction) {
    case 'up':
      return -deltaY
    case 'down':
      return deltaY
    case 'left':
      return -deltaX
    case 'right':
      return deltaX
    default:
      return 0
  }
}
/**
 * Parses the computed CSS transform into translate + scale components.
 *
 * @param element - Element whose transform to read.
 * @returns Parsed `{ x, y, scale }`.
 */
export function getElementTransform(element: HTMLElement): {
  x: number
  y: number
  scale: number
} {
  const computedStyle = window.getComputedStyle(element)
  const transform = computedStyle.transform
  let translateX = 0
  let translateY = 0
  let scale = 1
  if (transform && transform !== 'none') {
    const matrix = transform.match(/matrix(?:3d)?\(([^)]+)\)/)
    if (matrix?.[1]) {
      const values = matrix[1].split(', ').map(parseFloat)
      if (values.length === 6) {
        translateX = values[4] ?? 0
        translateY = values[5] ?? 0
        scale = Math.sqrt(
          (values[0] ?? 0) * (values[0] ?? 0) +
            (values[1] ?? 0) * (values[1] ?? 0)
        )
      } else if (values.length === 16) {
        translateX = values[12] ?? 0
        translateY = values[13] ?? 0
        scale = values[0] ?? 1
      }
    }
  }
  return { x: translateX, y: translateY, scale }
}
