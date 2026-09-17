/**
 * Whether `element` matches `:focus-visible` (keyboard focus).
 * In jsdom / unsupported environments, returns `true` so focus management is not blocked.
 *
 * @param element - Element to test, or `null`.
 * @returns Whether focus should be treated as visible.
 */
export function isFocusVisible(element: Element | null): boolean {
  if (!element) {
    return true
  }

  // jsdom does not match `:focus-visible` when the element has `:focus`.
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
    return true
  }

  try {
    return element.matches(':focus-visible')
  } catch {
    return true
  }
}
