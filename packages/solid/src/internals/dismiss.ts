import { contains, getTarget, ownerDocument } from '@script-augur/base-ui-utils'

import { listenerEffect } from './listenerEffect'

import type { Accessor } from 'solid-js'

/**
 * Escape key + outside pointer-down dismiss helpers. Attaches listeners while
 * `enabled` is true and cleans them up automatically.
 *
 * @param options - Dismiss configuration (`enabled`, `refs`, `onDismiss`).
 * @returns `void` — side-effect helper; listeners dispose with the owning scope.
 *
 * @example
 * ```tsx
 * import { createSignal } from "solid-js"
 * import { createDismiss } from "@script-augur/base-ui-solid"
 *
 * const [open, openAssign] = createSignal(true)
 * const [panel, panelAssign] = createSignal<HTMLElement | null>(null)
 *
 * createDismiss({
 *   enabled: open,
 *   refs: () => [panel()],
 *   onDismiss: () => openAssign(false),
 * })
 * ```
 */
export function createDismiss(options: DismissOptions): void {
  listenerEffect(
    () => {
      if (!options.enabled() || options.escapeKey === false) return null
      return ownerDocument(options.refs().find(Boolean) ?? null)
    },
    'keydown',
    event => {
      if (event.key === 'Escape') {
        options.onDismiss(event)
      }
    }
  )

  listenerEffect(
    () => {
      if (!options.enabled() || options.outsidePress === false) return null
      return ownerDocument(options.refs().find(Boolean) ?? null)
    },
    'pointerdown',
    event => {
      const target = getTarget(event) as Node | null
      const roots = options.refs().filter(Boolean) as Array<HTMLElement>
      if (roots.length === 0) return
      const inside = roots.some(root => contains(root, target))
      if (!inside) {
        options.onDismiss(event)
      }
    },
    true
  )
}

/**
 * Options for {@link createDismiss}.
 */
export interface DismissOptions {
  /** When false, listeners are not attached. */
  enabled: Accessor<boolean>
  /** Roots that should not count as "outside". */
  refs: Accessor<Array<HTMLElement | null | undefined>>
  /**
   * Called when Escape is pressed or a pointer-down lands outside `refs`.
   *
   * @param event - The originating keyboard or pointer event.
   */
  onDismiss: (event: Event) => void
  /** Listen for Escape. Defaults to `true`. */
  escapeKey?: boolean
  /** Listen for pointer down outside. Defaults to `true`. */
  outsidePress?: boolean
}
