import { ownerWindow } from './owner'

/**
 * Dispatches a constructed click on `target` that carries the source event's
 * modifier keys. Native `HTMLElement.click()` always reports modifiers as
 * unpressed; this matches Base UI's keyboard-activation path.
 *
 * @param target - Element that should receive the click.
 * @param sourceEvent - Modifier state copied onto the synthetic click.
 * @param options - Optional click `detail` (defaults to `0`, keyboard convention).
 *
 * @example
 * ```ts
 * dispatchClickWithModifiers(el, event)
 * ```
 */
export function dispatchClickWithModifiers(
  target: Element,
  sourceEvent: ModifierState,
  { detail = 0 }: { detail?: number } = {}
): void {
  // Prefer the owner window's constructors (iframes); fall back to globals for
  // environments where `Window` typings omit event constructors (e.g. some DTS).
  const win = ownerWindow(target) as Window &
    typeof globalThis & {
      PointerEvent: typeof PointerEvent
      MouseEvent: typeof MouseEvent
    }
  const EventCtor =
    typeof win.PointerEvent === 'function' ? win.PointerEvent : win.MouseEvent
  target.dispatchEvent(
    new EventCtor('click', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail,
      shiftKey: sourceEvent.shiftKey,
      ctrlKey: sourceEvent.ctrlKey,
      altKey: sourceEvent.altKey,
      metaKey: sourceEvent.metaKey,
    })
  )
}

interface ModifierState {
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}
