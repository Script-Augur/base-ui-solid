/**
 * Midpoint of an element along the slider axis.
 *
 * @param element - Thumb (or other) element to measure.
 * @param vertical - When `true`, use the vertical center; otherwise horizontal.
 */
export function getMidpoint(element: HTMLElement, vertical: boolean): number {
  const rect = element.getBoundingClientRect()
  return vertical ? (rect.top + rect.bottom) / 2 : (rect.left + rect.right) / 2
}
