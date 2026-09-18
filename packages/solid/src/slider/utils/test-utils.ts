/**
 * Builds a `changedTouches` bag for pointer/touch tests.
 */
export function createTouches(touches: Touches) {
  return {
    changedTouches: touches.map(
      touch =>
        new Touch({
          target: document.body,
          ...touch,
        })
    ),
  }
}
/**
 * Default horizontal slider control rect for pointer-position tests.
 */
export function getHorizontalSliderRect(width = 100) {
  return new DOMRect(0, 0, width, 10)
}
type Touches = Array<Pick<Touch, 'identifier' | 'clientX' | 'clientY'>>
