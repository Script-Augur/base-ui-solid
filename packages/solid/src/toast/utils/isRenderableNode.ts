import type { JSX } from 'solid-js'

/**
 * Whether a Solid JSX node should be treated as renderable content.
 *
 * @param node - Candidate children / content.
 * @returns `true` when the node is non-empty content.
 */
export function isRenderableNode(node: JSX.Element | undefined): boolean {
  if (node == null || typeof node === 'boolean' || node === '') {
    return false
  }
  if (Array.isArray(node)) {
    return node.some(isRenderableNode)
  }
  return true
}

/**
 * Whether evaluated children carry renderable content (for Title / Description / Action).
 *
 * @param children - Children prop value.
 * @returns `true` when children should mount.
 */
export function hasRenderableChildren(
  children: JSX.Element | undefined
): boolean {
  return isRenderableNode(children)
}
