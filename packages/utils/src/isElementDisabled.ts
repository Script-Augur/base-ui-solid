/**
 * Whether an element should be treated as disabled for pointer/keyboard
 * interaction (`disabled` property or `aria-disabled="true"`).
 *
 * @param element - Element to inspect.
 * @returns `true` when the element is disabled.
 *
 * @example
 * ```ts
 * import { isElementDisabled } from "@script-augur/base-ui-utils"
 *
 * if (isElementDisabled(event.currentTarget)) return
 * ```
 */
export function isElementDisabled(
  element: Element | null | undefined
): boolean {
  if (!element || !(element instanceof HTMLElement)) return false
  if (
    'disabled' in element &&
    Boolean((element as HTMLInputElement).disabled)
  ) {
    return true
  }
  return element.getAttribute('aria-disabled') === 'true'
}
