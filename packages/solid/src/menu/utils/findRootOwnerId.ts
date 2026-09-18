/**
 * Walks up from `node` looking for `data-rootownerid` (Menu popup attribute).
 *
 * @param node - DOM node to start from.
 * @returns Owner id string, or `undefined` when none is found.
 */
export function findRootOwnerId(node: Node | null): string | undefined {
  let current: Node | null = node
  while (current) {
    if (current instanceof HTMLElement && current.hasAttribute('data-rootownerid')) {
      return current.getAttribute('data-rootownerid') ?? undefined
    }
    if (
      current === document.documentElement ||
      current === document.body ||
      current === document
    ) {
      return undefined
    }
    current = current.parentNode
  }
  return undefined
}
