import { createEffect, onCleanup } from 'solid-js'

import type { Accessor } from 'solid-js'
/**
 * Binds `target.addEventListener` while the accessor is non-null and removes
 * the listener on cleanup or when the target changes.
 *
 * Reads `target` inside an effect so a signal/accessor rebinds automatically.
 * The listener function is not tracked; pass a stable callback (for example a
 * function declaration in the owner component).
 *
 * @typeParam TKey - Event name from {@link DOMEventMap}.
 * @param target - Accessor for the event target (`null`/`undefined` skips bind).
 * @param type - Event type (`'keydown'`, `'pointerdown'`, `'scroll'`, …).
 * @param listener - Handler invoked with the typed event.
 * @param options - `addEventListener` options (capture, passive, once).
 * @returns `void` — side-effect helper; the listener disposes with the owner.
 *
 * @example
 * ```ts
 * const [root, rootAssign] = createSignal<HTMLElement | null>(null)
 * listenerEffect(root, 'keydown', onKeyDown)
 * listenerEffect(root, 'pointerdown', onPointerDown, true)
 * ```
 */
export function listenerEffect<TKey extends keyof DOMEventMap>(
  target: Accessor<EventTarget | null | undefined>,
  type: TKey,
  listener: (event: DOMEventMap[TKey]) => void,
  options?: boolean | AddEventListenerOptions
): void {
  /**
   * Attaches the listener when `target()` is non-null.
   */
  createEffect(function bindListenerEffect() {
    const element = target()
    if (!element) return

    const eventListener = listener as EventListener
    element.addEventListener(type, eventListener, options)

    /**
     * Removes the listener when the target changes or the owner disposes.
     */
    onCleanup(function unbindListenerEffect() {
      element.removeEventListener(type, eventListener, options)
    })
  })
}

/**
 * Union of DOM event maps so {@link listenerEffect} can type listeners on
 * elements, documents, or windows.
 */
export type DOMEventMap = HTMLElementEventMap &
  DocumentEventMap &
  WindowEventMap
