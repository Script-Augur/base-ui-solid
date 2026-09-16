import { readMaybeAccessor } from '../internals/readMaybeAccessor'

import type { MaybeAccessor } from '../internals/readMaybeAccessor'

/**
 * Returns true when `value` is a valid portal mount node.
 */
export function isPortalContainer(value: unknown): value is PortalContainer {
  if (value instanceof HTMLElement) return true
  return typeof ShadowRoot !== 'undefined' && value instanceof ShadowRoot
}

/**
 * Resolves the portal mount target the way upstream `useFloatingPortalNode`
 * does, with Solid-friendly deferred accessors:
 *
 * - `container` omitted → parent portal host / `document.body`
 * - `container={null}` → wait
 * - accessor / value `null` → wait (Solid deferred container)
 * - provided but not `HTMLElement`/`ShadowRoot` → wait (no silent body mount)
 * - otherwise → prop node
 *
 * @param containerProp - Portal `container` prop (`null` = wait).
 * @param parentPortalNode - Host node from a parent {@link Portal}, if any.
 * @returns The mount node, or `null` while waiting / SSR without `document`.
 */
export function resolvePortalContainer(
  containerProp: PortalContainerProp | undefined,
  parentPortalNode: HTMLElement | null | undefined
): PortalContainer | null {
  if (containerProp === null) {
    return null
  }

  if (containerProp !== undefined) {
    // Accessors: treat null/undefined as “wait” so deferred containers do not
    // briefly mount to document.body.
    if (typeof containerProp === 'function') {
      const resolved = containerProp()
      if (resolved == null) {
        return null
      }
      if (isPortalContainer(resolved)) {
        return resolved
      }
      warnInvalidContainer(resolved)
      return null
    }

    const resolved = readMaybeAccessor<PortalContainer | null | undefined>(
      containerProp,
      undefined
    )
    if (resolved == null) {
      return null
    }
    if (isPortalContainer(resolved)) {
      return resolved
    }
    warnInvalidContainer(resolved)
    return null
  }

  if (parentPortalNode) {
    return parentPortalNode
  }

  if (typeof document !== 'undefined') {
    return document.body
  }

  return null
}

/**
 * Resolved portal mount target (element or shadow root).
 */
export type PortalContainer = HTMLElement | ShadowRoot

/**
 * Public `container` prop: a node, a Solid accessor, or `null` to defer mount.
 */
export type PortalContainerProp = MaybeAccessor<
  PortalContainer | null | undefined
> | null

function warnInvalidContainer(value: unknown): void {
  if (process.env.NODE_ENV === 'production') return
  console.warn(
    '[base-ui-solid] Portal `container` resolved to a non-HTMLElement/ShadowRoot value; deferring mount instead of falling back to document.body.',
    value
  )
}
