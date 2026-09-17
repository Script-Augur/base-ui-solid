/**
 * Adds an event listener and returns a cleanup function to remove it.
 *
 * Matches `@base-ui/utils/addEventListener`.
 */
export function addEventListener<
  TTarget extends KnownEventTarget,
  TType extends keyof EventMap<TTarget>,
>(
  target: TTarget,
  type: TType,
  listener: TypedEventListener<TTarget, EventMap<TTarget>[TType]>,
  options?: boolean | AddEventListenerOptions
): () => void
export function addEventListener(
  target: EventTargetWithListeners,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): () => void
export function addEventListener(
  target: EventTargetWithListeners,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): () => void {
  target.addEventListener(type, listener, options)
  return () => {
    target.removeEventListener(type, listener, options)
  }
}
type EventTargetWithListeners = Pick<
  EventTarget,
  'addEventListener' | 'removeEventListener'
>
type KnownEventTarget =
  | AbortSignal
  | Document
  | Element
  | HTMLElement
  | MediaQueryList
  | SVGElement
  | VisualViewport
  | Window
type EventMap<TTarget> = TTarget extends Window
  ? WindowEventMap
  : TTarget extends Document
    ? DocumentEventMap
    : TTarget extends MediaQueryList
      ? MediaQueryListEventMap
      : TTarget extends VisualViewport
        ? VisualViewportEventMap
        : TTarget extends SVGElement
          ? SVGElementEventMap
          : TTarget extends HTMLElement
            ? HTMLElementEventMap
            : TTarget extends Element
              ? ElementEventMap & GlobalEventHandlersEventMap
              : TTarget extends AbortSignal
                ? AbortSignalEventMap
                : never
type TypedEventListener<TTarget, TEvent> =
  | { handleEvent: (event: TEvent) => void }
  | ((this: TTarget, event: TEvent) => void)
