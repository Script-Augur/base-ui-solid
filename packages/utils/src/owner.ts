/**
 * Document that owns `node`, or the global `document` when `node` is missing.
 *
 * Prefer this over global `document` when code is tied to a DOM node (shadow
 * roots / iframes).
 *
 * @param node - Node whose owner document should be resolved.
 * @returns The owner `Document`.
 *
 * @example
 * ```ts
 * import { ownerDocument } from "@script-augur/base-ui-utils"
 *
 * const doc = ownerDocument(buttonEl)
 * doc.addEventListener("keydown", onKeyDown)
 * ```
 */
export function ownerDocument(node?: Node | null): Document {
  return node?.ownerDocument ?? document
}

/**
 * Window that owns `node`, or the global `window` when unavailable.
 *
 * @param node - Node whose owner window should be resolved.
 * @returns The owner `Window`.
 *
 * @example
 * ```ts
 * import { ownerWindow } from "@script-augur/base-ui-utils"
 *
 * const win = ownerWindow(buttonEl)
 * win.requestAnimationFrame(tick)
 * ```
 */
export function ownerWindow(node?: Node | null): Window {
  return ownerDocument(node).defaultView ?? window
}
