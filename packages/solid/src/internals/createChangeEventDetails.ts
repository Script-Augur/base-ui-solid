/**
 * Reasons used in Base UI change event details.
 * Expand as more components need distinct reasons.
 */
export const REASONS = {
  none: 'none',
  triggerPress: 'trigger-press',
  initial: 'initial',
  disabled: 'disabled',
  missing: 'missing',
  listNavigation: 'list-navigation',
} as const

/**
 * Creates cancelable change-event details for `on*Change` handlers.
 *
 * Matches upstream `createChangeEventDetails(reason, event, trigger, customProperties)`
 * closely enough for Accordion (2-arg) and Tabs (custom props like
 * `activationDirection`).
 *
 * @typeParam TReason - Reason string union for this event.
 * @typeParam TCustom - Extra properties merged onto the details object.
 * @param reason - Why the change occurred.
 * @param event - Optional native event that triggered the change.
 * @param trigger - Optional element that triggered the change.
 * @param customProperties - Optional extra fields merged onto details.
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
  TCustom extends Record<string, unknown> = Record<string, never>,
>(
  reason: TReason,
  event?: Event,
  trigger?: Element,
  customProperties?: TCustom
): BaseUIChangeEventDetails<TReason> & TCustom {
  let canceled = false
  const details = {
    reason,
    event: event ?? new Event('base-ui'),
    trigger,
    cancel() {
      canceled = true
    },
    get isCanceled() {
      return canceled
    },
    ...(customProperties ?? ({} as TCustom)),
  }

  return details
}

/**
 * Reason strings from {@link REASONS}.
 */
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
  /** Element that triggered the change, when applicable. */
  trigger?: Element
  /** Prevents the component from committing the change. */
  cancel: () => void
  /** Whether {@link cancel} was called. */
  readonly isCanceled: boolean
}
