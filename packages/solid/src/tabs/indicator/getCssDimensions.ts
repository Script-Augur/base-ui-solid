/**
 * Computes layout dimensions from CSS, falling back to offset sizes when
 * rounded computed values disagree with layout (matches upstream indicator).
 *
 * @param element - Element to measure.
 * @returns Width and height in pixels.
 */
export function getCssDimensions(element: HTMLElement): {
  width: number
  height: number
} {
  const css = getComputedStyle(element)
  let cssWidth = parseFloat(css.width) || 0
  let cssHeight = parseFloat(css.height) || 0
  const shouldFallback =
    Math.round(cssWidth) !== element.offsetWidth ||
    Math.round(cssHeight) !== element.offsetHeight

  if (shouldFallback) {
    cssWidth = element.offsetWidth
    cssHeight = element.offsetHeight
  }

  return {
    width: cssWidth,
    height: cssHeight,
  }
}
