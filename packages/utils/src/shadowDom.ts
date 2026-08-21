/**
 * Shadow-DOM-safe containment check (`parent` contains `child`, including
 * crossing shadow boundaries via `host`).
 *
 * @param parent - Potential ancestor.
 * @param child - Potential descendant.
 * @returns `true` when `child` is inside `parent`.
 *
 * @example
 * ```ts
 * import { contains } from "@script-augur/base-ui-utils"
 *
 * if (!contains(panel, event.target as Node)) {
 *   close()
 * }
 * ```
 */
export function contains(
  parent: Node | null | undefined,
  child: Node | null,
): boolean {
  if (!parent || !child) return false
  if (parent === child) return true

  const rootNode = child.getRootNode()
  if (rootNode === child.ownerDocument) {
    return parent.contains(child)
  }

  let current: Node | null = child
  while (current) {
    if (current === parent) return true
    let shadowHost: Element | null = null
    if (current.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      shadowHost = (current as ShadowRoot).host
    }
    current = shadowHost ?? current.parentNode
  }
  return false
}

/**
 * Event target, preferring `composedPath()[0]` when available (shadow DOM).
 *
 * @param event - DOM event.
 * @returns The deepest event target, or `null`.
 *
 * @example
 * ```ts
 * import { getTarget } from "@script-augur/base-ui-utils"
 *
 * const target = getTarget(event)
 * ```
 */
export function getTarget(event: Event): EventTarget | null {
  if ("composedPath" in event && typeof event.composedPath === "function") {
    const path = event.composedPath()
    return path[0] ?? event.target
  }
  return event.target
}

/**
 * Active element, descending into open shadow roots.
 *
 * @param doc - Document to query. Defaults to the global `document`.
 * @returns The focused element, or `null`.
 *
 * @example
 * ```ts
 * import { activeElement } from "@script-augur/base-ui-utils"
 *
 * const focused = activeElement()
 * ```
 */
export function activeElement(doc: Document = document): Element | null {
  let active = doc.activeElement
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }
  return active
}
