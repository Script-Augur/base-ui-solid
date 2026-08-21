/**
 * Reasons used in Base UI change event details.
 * Expand as more components need distinct reasons.
 */
export const REASONS = {
  none: 'none',
  triggerPress: 'trigger-press',
} as const

/**
 * Creates cancelable change-event details for `on*Change` handlers.
 *
 * @typeParam TReason - Reason string union for this event.
 * @param reason - Why the change occurred.
 * @param event - Optional native event that triggered the change.
 * @returns A details object with {@link BaseUIChangeEventDetails.cancel}.
 *
 * @example
 * ```ts
 * const details = createChangeEventDetails(REASONS.none, event)
 * onPressedChange?.(next, details)
 * if (details.isCanceled) return
 * ```
 */
export function createChangeEventDetails<
  TReason extends string = ChangeEventReason,
>(reason: TReason, event?: Event): BaseUIChangeEventDetails<TReason> {
  let canceled = false
  return {
    reason,
    event,
    cancel() {
      canceled = true
    },
    get isCanceled() {
      return canceled
    },
  }
}

export type ChangeEventReason = (typeof REASONS)[keyof typeof REASONS]

/**
 * Cancelable change-event details passed to Base UI `on*Change` callbacks.
 *
 * @typeParam TReason - Reason string union for this event.
 */
export interface BaseUIChangeEventDetails<
  TReason extends string = ChangeEventReason,
> {
  /** Why the change occurred. */
  reason: TReason
  /** Underlying native event when available. */
  event?: Event
  /** Prevents the component from committing the change. */
  cancel: () => void
  /** Whether {@link cancel} was called. */
  readonly isCanceled: boolean
}
