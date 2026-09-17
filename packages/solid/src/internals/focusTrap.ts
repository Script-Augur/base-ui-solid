import {
  activeElement,
  contains,
  ownerDocument,
} from '@script-augur/base-ui-utils'
import { createEffect, onCleanup } from 'solid-js'
import { tabbable } from 'tabbable'

import { listenerEffect } from './listenerEffect'

import type { Accessor } from 'solid-js'

/**
 * Basic focus trap: Tab cycles within `container` while enabled, and focus is
 * restored on cleanup.
 *
 * @param options - Focus trap configuration (`enabled`, `container`, optional focus targets).
 * @returns `void` — side-effect helper; listeners dispose with the owning scope.
 *
 * @example
 * ```tsx
 * import { createSignal } from "solid-js"
 * import { createFocusTrap } from "@script-augur/base-ui-solid"
 *
 * const [open] = createSignal(true)
 * const [dialog, dialogAssign] = createSignal<HTMLElement | null>(null)
 *
 * createFocusTrap({
 *   enabled: open,
 *   container: dialog,
 * })
 * ```
 */
export function createFocusTrap(options: FocusTrapOptions): void {
  let previouslyFocused: Element | null = null

  createEffect(() => {
    const enabled = options.enabled()
    const container = options.container()
    if (!enabled || !container) return

    const doc = ownerDocument(container)
    previouslyFocused = activeElement(doc)

    const initial = options.initialFocus?.()
    if (initial === false) {
      // Caller opted out of move-focus on open.
    } else {
      const target = initial ?? getTabbables(container)[0]
      if (target) {
        queueMicrotask(() => target.focus())
      } else {
        if (!container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1')
        }
        queueMicrotask(() => container.focus())
      }
    }

    onCleanup(() => {
      // Capture before sibling cleanups clear Popup focus props.
      const restore = options.restoreFocus?.()
      // Defer so option-only re-runs (e.g. late `initialFocus` element) do not
      // restore while the trap is still active.
      queueMicrotask(() => {
        if (options.enabled() && options.container()) {
          return
        }
        if (restore === false) {
          return
        }
        const target =
          restore ?? (previouslyFocused as HTMLElement | null | undefined)
        if (target && typeof target.focus === 'function') {
          target.focus()
        }
      })
    })
  })

  listenerEffect(
    () => {
      const enabled = options.enabled()
      const container = options.container()
      if (!enabled || !container) return null

      return ownerDocument(container)
    },
    'keydown',
    event => {
      const container = options.container()
      if (!container || event.key !== 'Tab') return

      const items = getTabbables(container)
      if (items.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = items[0]!
      const last = items[items.length - 1]!
      const doc = ownerDocument(container)
      const active = activeElement(doc)

      if (event.shiftKey) {
        if (active === first || !contains(container, active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !contains(container, active)) {
        event.preventDefault()
        first.focus()
      }
    }
  )
}

/**
 * Options for {@link createFocusTrap}.
 */
export interface FocusTrapOptions {
  /** When false, the trap is inactive. */
  enabled: Accessor<boolean>
  /** Container whose tabbables participate in the cycle. */
  container: Accessor<HTMLElement | null | undefined>
  /**
   * Element to restore focus to when the trap disables.
   * - `false`: do not restore focus
   * - `HTMLElement`: focus that element
   * - omitted / `null` / `undefined`: previously focused element
   */
  restoreFocus?: Accessor<HTMLElement | null | undefined | false>
  /**
   * Initially focus this element, or the first tabbable when omitted.
   * Pass `false` to skip move-focus on open.
   */
  initialFocus?: Accessor<HTMLElement | null | undefined | false>
}

/**
 * Returns tabbable elements inside `container` (excluding the container itself).
 *
 * @param container - Root to search.
 * @returns Tabbable HTML elements.
 */
function getTabbables(container: HTMLElement): Array<HTMLElement> {
  return tabbable(container, {
    includeContainer: false,
    // jsdom has no layout; `full` display checks yield an empty list.
    displayCheck: 'none',
  }) as Array<HTMLElement>
}
