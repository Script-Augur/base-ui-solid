import type { Align, Side } from '../popover/positioner/placement'
import type { Accessor, JSX } from 'solid-js'

/**
 * Shared toast types (kept free of Provider/store imports to avoid DTS cycles).
 */

/** A toast once managed by the provider / store. */
export interface ToastObject<TData extends object = Record<string, never>> {
  /**
   * The unique identifier for the toast.
   */
  id: string
  /**
   * The DOM element for the toast root (Solid ref value).
   */
  ref?: HTMLElement | null | undefined
  /**
   * The title of the toast.
   */
  title?: JSX.Element | string
  /**
   * The type of the toast. Used to conditionally style the toast,
   * including conditionally rendering elements based on the type.
   */
  type?: string | undefined
  /**
   * The description of the toast.
   */
  description?: JSX.Element | string
  /**
   * The amount of time (in ms) before the toast is auto dismissed.
   * A value of `0` will prevent the toast from being dismissed automatically.
   * @default 5000
   */
  timeout?: number | undefined
  /**
   * The priority of the toast.
   * - `low` - The toast will be announced politely.
   * - `high` - The toast will be announced urgently.
   * @default 'low'
   */
  priority?: 'low' | 'high' | undefined
  /**
   * The transition status of the toast.
   */
  transitionStatus?: 'starting' | 'ending' | undefined
  /**
   * A counter that increments whenever the toast is updated or upserted.
   */
  updateKey?: number | undefined
  /**
   * Determines if the toast was limited because the toast limit was exceeded.
   */
  limited?: boolean | undefined
  /**
   * The height of the toast.
   */
  height?: number | undefined
  /**
   * Callback function to be called when the toast is closed.
   */
  onClose?: (() => void) | undefined
  /**
   * Callback when the toast is removed after close animations complete.
   */
  onRemove?: (() => void) | undefined
  /**
   * The props for the action button.
   */
  actionProps?: JSX.ButtonHTMLAttributes<HTMLButtonElement> | undefined
  /**
   * Props forwarded to the toast positioner when rendering anchored toasts.
   */
  positionerProps?: ToastManagerPositionerProps | undefined
  /**
   * Custom data for the toast.
   */
  data?: TData | undefined
}

/**
 * Positioner props accepted via `ToastObject.positionerProps`.
 * Mirrors {@link ToastPositionerProps} without importing the component module.
 */
export interface ToastManagerPositionerProps {
  /**
   * An element to position the toast against.
   */
  anchor?: Element | null | undefined
  /**
   * Which side of the anchor element to align the toast against.
   * @default 'top'
   */
  side?: Side | undefined
  /**
   * How to align the toast relative to the specified side.
   * @default 'center'
   */
  align?: Align | undefined
  /** CSS `position` strategy. @default 'absolute' */
  positionMethod?: 'absolute' | 'fixed' | undefined
  /** Offset from the side of the anchor. @default 0 */
  sideOffset?: number | undefined
  /** Offset along the alignment axis. @default 0 */
  alignOffset?: number | undefined
  collisionBoundary?: unknown
  collisionPadding?: number | undefined
  arrowPadding?: number | undefined
  sticky?: boolean | undefined
  disableAnchorTracking?: boolean | undefined
  collisionAvoidance?: unknown
}

/** Return value of {@link useToastManager}. */
export interface UseToastManagerReturnValue<
  TData extends object = Record<string, never>,
> {
  toasts: Accessor<Array<ToastObject<TData>>>
  add: <T extends TData = TData>(options: ToastManagerAddOptions<T>) => string
  close: (toastId?: string) => void
  update: <T extends TData = TData>(
    toastId: string,
    options: ToastManagerUpdateOptions<T>
  ) => void
  promise: <TValue, T extends TData = TData>(
    promise: Promise<TValue>,
    options: ToastManagerPromiseOptions<TValue, T>
  ) => Promise<TValue>
}

/** Options for add. */
export interface ToastManagerAddOptions<TData extends object> extends Omit<
  ToastObject<TData>,
  'id' | 'animation' | 'height' | 'ref' | 'limited' | 'updateKey'
> {
  /**
   * The unique identifier for the toast. Adding a toast with an existing ID
   * updates it in place and refreshes its auto-dismiss timer.
   */
  id?: string | undefined
}

/** Options for update. */
export interface ToastManagerUpdateOptions<
  TData extends object,
> extends Partial<
  Omit<
    ToastObject<TData>,
    'id' | 'ref' | 'height' | 'transitionStatus' | 'limited' | 'updateKey'
  >
> {}

/** Options for promise. */
export interface ToastManagerPromiseOptions<TValue, TData extends object> {
  loading: string | ToastManagerUpdateOptions<TData>
  success:
    | string
    | ToastManagerUpdateOptions<TData>
    | ((result: TValue) => string | ToastManagerUpdateOptions<TData>)
  error:
    | string
    | ToastManagerUpdateOptions<TData>
    | ((error: unknown) => string | ToastManagerUpdateOptions<TData>)
}
