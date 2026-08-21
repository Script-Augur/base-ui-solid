import {
  activeElement,
  contains,
  ownerDocument,
} from '@script-augur/base-ui-utils'
import { createEffect, onCleanup } from 'solid-js'
import { tabbable } from 'tabbable'

import type { Accessor } from 'solid-js'

/**
 * Basic focus trap: Tab cycles within `container` while enabled, and focus is
 * restored on cleanup.
 *
 * @param options - Focus trap configuration.
 * @returns `void` — side-effect helper; listeners dispose with the owning scope.
 *
 * @example
 * ```tsx
 * import { createSignal } from "solid-js"
 * import { createFocusTrap } from "@script-augur/base-ui-solid"
 *
 * const [open] = createSignal(true)
 * const [dialog, setDialog] = createSignal<HTMLElement | null>(null)
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

    const initial = options.initialFocus?.() ?? getTabbables(container)[0]
    if (initial) {
      queueMicrotask(() => initial.focus())
    } else {
      if (!container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '-1')
      }
      queueMicrotask(() => container.focus())
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = getTabbables(container)
      if (items.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
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

    doc.addEventListener('keydown', onKeyDown)

    onCleanup(() => {
      doc.removeEventListener('keydown', onKeyDown)
      const restore =
        options.restoreFocus?.() ?? (previouslyFocused as HTMLElement | null)
      if (restore && typeof restore.focus === 'function') {
        queueMicrotask(() => restore.focus())
      }
    })
  })
}

/**
 * Options for {@link createFocusTrap}.
 */
export interface FocusTrapOptions {
  /** When false, the trap is inactive. */
  enabled: Accessor<boolean>
  /** Container whose tabbables participate in the cycle. */
  container: Accessor<HTMLElement | null | undefined>
  /** Element to restore focus to when the trap disables. */
  restoreFocus?: Accessor<HTMLElement | null | undefined>
  /** Initially focus this element, or the first tabbable when omitted. */
  initialFocus?: Accessor<HTMLElement | null | undefined>
}

/**
 * Returns tabbable elements inside `container` (excluding the container itself).
 *
 * @param container - Root to search.
 * @returns Tabbable HTML elements.
 */
function getTabbables(container: HTMLElement): Array<HTMLElement> {
  return tabbable(container, { includeContainer: false }) as Array<HTMLElement>
}
