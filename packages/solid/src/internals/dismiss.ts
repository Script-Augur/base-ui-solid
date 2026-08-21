import { contains, getTarget, ownerDocument } from "@script-augur/base-ui-utils"
import { createEffect, onCleanup } from "solid-js"

import type { Accessor } from "solid-js"

/**
 * Escape key + outside pointer-down dismiss helpers. Attaches listeners while
 * `enabled` is true and cleans them up automatically.
 *
 * @param options - Dismiss configuration.
 * @returns `void` — side-effect helper; listeners dispose with the owning scope.
 *
 * @example
 * ```tsx
 * import { createSignal } from "solid-js"
 * import { createDismiss } from "@script-augur/base-ui-solid"
 *
 * const [open, setOpen] = createSignal(true)
 * const [panel, setPanel] = createSignal<HTMLElement | null>(null)
 *
 * createDismiss({
 *   enabled: open,
 *   refs: () => [panel()],
 *   onDismiss: () => setOpen(false),
 * })
 * ```
 */
export function createDismiss(options: DismissOptions): void {
  createEffect(() => {
    if (!options.enabled()) return

    const escapeKey = options.escapeKey !== false
    const outsidePress = options.outsidePress !== false
    const doc = ownerDocument(options.refs().find(Boolean) ?? null)

    const onKeyDown = (event: KeyboardEvent) => {
      if (!escapeKey) return
      if (event.key === "Escape") {
        options.onDismiss(event)
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!outsidePress) return
      const target = getTarget(event) as Node | null
      const roots = options.refs().filter(Boolean) as Array<HTMLElement>
      if (roots.length === 0) return
      const inside = roots.some(root => contains(root, target))
      if (!inside) {
        options.onDismiss(event)
      }
    }

    if (escapeKey) {
      doc.addEventListener("keydown", onKeyDown)
    }
    if (outsidePress) {
      doc.addEventListener("pointerdown", onPointerDown, true)
    }

    onCleanup(() => {
      doc.removeEventListener("keydown", onKeyDown)
      doc.removeEventListener("pointerdown", onPointerDown, true)
    })
  })
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
