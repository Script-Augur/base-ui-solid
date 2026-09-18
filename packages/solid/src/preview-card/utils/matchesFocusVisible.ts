/**
 * Whether `element` matches `:focus-visible` (keyboard / intentional focus).
 *
 * Matches upstream Floating UI `matchesFocusVisible`: JSDOM always returns
 * `true` because it does not reliably match `:focus-visible` when the element
 * has `:focus`.
 *
 * @param element - Focused element to test.
 * @returns `true` when focus-open should be allowed.
 */
export function matchesFocusVisible(element: Element | null): boolean {
  if (!element) return false
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
    return true
  }
  try {
    return element.matches(':focus-visible')
  } catch {
    return true
  }
}
