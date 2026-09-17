/**
 * Tracks keyboard vs pointer modality so focus-open can approximate
 * `:focus-visible` in environments (jsdom) where that selector is unreliable.
 *
 * After a mouse/pen `pointerdown`, focus-open is refused until a `keydown`
 * restores keyboard modality — matching upstream `useFocus` + `:focus-visible`
 * behavior for click-to-focus.
 */

let keyboardModality = true
let listenersBound = false

/**
 * Installs document-level modality listeners (idempotent). Call from Trigger
 * mount so pointerdown is observed before the subsequent focus event.
 */
export function ensureFocusModalityListeners(): void {
  if (listenersBound || typeof document === 'undefined') return
  listenersBound = true

  document.addEventListener(
    'keydown',
    () => {
      keyboardModality = true
    },
    true
  )
  document.addEventListener(
    'pointerdown',
    (event: PointerEvent) => {
      // Touch focus is not a `:focus-visible` keyboard open path for tooltips;
      // treat mouse/pen (and empty pointerType from synthetic events) as pointer.
      if (
        event.pointerType === 'mouse' ||
        event.pointerType === 'pen' ||
        event.pointerType === ''
      ) {
        keyboardModality = false
      }
    },
    true
  )
}

/**
 * Whether a focus event on `element` should open a tooltip.
 *
 * Keyboard modality always allows open. Pointer modality refuses (jsdom often
 * reports `:focus-visible` as true after any focus, so modality is
 * authoritative for the mouse click → focus path).
 *
 * @param _element - The focused element (typically the trigger).
 * @returns `true` when focus-open is allowed.
 */
export function isFocusVisibleOpenAllowed(_element: Element): boolean {
  ensureFocusModalityListeners()
  return keyboardModality
}

/** @internal Test helper — resets modality to keyboard. */
export function resetFocusModalityForTests(): void {
  keyboardModality = true
}
