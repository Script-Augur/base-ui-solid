import { createContext, useContext } from 'solid-js'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../internals/createChangeEventDetails'
import type { Accessor } from 'solid-js'

const ToggleGroupContext = createContext<ToggleGroupContextValue | undefined>(
  undefined
)

export { ToggleGroupContext }

/**
 * Reads the nearest {@link ToggleGroup} context, if any.
 *
 * @returns Context value, or `undefined` outside a toggle group.
 */
export function useToggleGroupContext(): ToggleGroupContextValue | undefined {
  return useContext(ToggleGroupContext)
}

/**
 * Shared state for toggles nested under {@link ToggleGroup}.
 */
export interface ToggleGroupContextValue {
  /** Values of currently pressed toggles. */
  value: Accessor<ReadonlyArray<string>>
  /**
   * Updates group membership for a toggle value.
   *
   * @param newValue - Toggle `value` being pressed or released.
   * @param nextPressed - Whether that toggle should become pressed.
   * @param eventDetails - Shared change-event details (cancelable).
   * @returns `false` if the change was canceled; otherwise `true`.
   */
  setGroupValue: (
    newValue: string,
    nextPressed: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => boolean
  /** Whether the group ignores user interaction. */
  disabled: Accessor<boolean>
  /**
   * Whether `value` or `defaultValue` was provided on the group.
   * Used to warn when nested toggles omit `value`.
   */
  isValueInitialized: Accessor<boolean>
}
