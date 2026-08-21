import { ownerDocument } from '@script-augur/base-ui-utils'
import { createEffect, onCleanup } from 'solid-js'

import type { Accessor } from 'solid-js'

let lockCount = 0
let previousOverflow = ''
let previousPaddingRight = ''

/**
 * Locks `document.body` scroll while `enabled` is true. Supports nested locks
 * via a reference count so overlapping overlays do not unlock early.
 *
 * @param enabled - Accessor that toggles the lock for this caller.
 * @returns `void` — side-effect helper; unlocks on cleanup when the last lock drops.
 *
 * @example
 * ```tsx
 * import { createSignal } from "solid-js"
 * import { createScrollLock } from "@script-augur/base-ui-solid"
 *
 * const [open] = createSignal(true)
 * createScrollLock(open)
 * ```
 */
export function createScrollLock(enabled: Accessor<boolean>): void {
  createEffect(() => {
    if (!enabled()) return

    const doc = ownerDocument()
    const body = doc.body

    if (lockCount === 0) {
      previousOverflow = body.style.overflow
      previousPaddingRight = body.style.paddingRight
      const scrollbarWidth = getScrollbarWidth(doc)
      body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`
      }
    }
    lockCount += 1

    onCleanup(() => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) {
        body.style.overflow = previousOverflow
        body.style.paddingRight = previousPaddingRight
      }
    })
  })
}

/**
 * Width of the vertical scrollbar for `doc`'s viewport.
 *
 * @param doc - Document to measure.
 * @returns Scrollbar width in CSS pixels.
 */
function getScrollbarWidth(doc: Document): number {
  return window.innerWidth - doc.documentElement.clientWidth
}
