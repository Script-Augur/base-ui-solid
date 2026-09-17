import { contains } from '@script-augur/base-ui-utils'

/**
 * Lite outside-menu check (no FloatingTree node children).
 *
 * @param targets - Focus blur current / related targets.
 * @param params - Popup and root elements.
 * @returns `true` when focus left the menu entirely.
 */
export function isOutsideMenuEvent(
  targets: {
    currentTarget: HTMLElement | null
    relatedTarget: HTMLElement | null
  },
  params: {
    popupElement: HTMLElement | null
    rootElement: HTMLElement | null
  }
): boolean {
  const { currentTarget, relatedTarget } = targets
  const { popupElement, rootElement } = params

  if (!popupElement) {
    return !contains(rootElement, relatedTarget)
  }

  return (
    !contains(popupElement, currentTarget) &&
    !contains(popupElement, relatedTarget) &&
    !contains(rootElement, relatedTarget)
  )
}
