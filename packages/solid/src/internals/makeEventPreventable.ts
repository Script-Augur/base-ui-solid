/**
 * Attaches `preventBaseUIHandler` onto a DOM event so internal Base UI handlers
 * can be cancelled by earlier listeners.
 *
 * @typeParam T - Event type being decorated.
 * @param event - Event to make preventable.
 * @returns The same event, typed as {@link BaseUIEvent}.
 *
 * @example
 * ```ts
 * makeEventPreventable(event)
 * if (event.baseUIHandlerPrevented) return
 * ```
 */
export function makeEventPreventable<T extends Event>(
  event: T
): BaseUIEvent<T> {
  const baseUIEvent = event as BaseUIEvent<T>
  baseUIEvent.preventBaseUIHandler = () => {
    baseUIEvent.baseUIHandlerPrevented = true
  }
  return baseUIEvent
}

/** Event shape extended with Base UI handler-prevention hooks. */
export type BaseUIEvent<T extends Event = Event> = T & {
  preventBaseUIHandler: () => void
  baseUIHandlerPrevented?: boolean
}
