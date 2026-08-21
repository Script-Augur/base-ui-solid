import { createContext, useContext } from 'solid-js'

import type { AccordionRootState, AccordionValue } from './AccordionRoot'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { Accessor } from 'solid-js'

const AccordionRootContext = createContext<
  AccordionRootContextValue | undefined
>(undefined)

export { AccordionRootContext }

/**
 * Reads the nearest {@link AccordionRoot} context.
 *
 * @returns Context value.
 * @throws If used outside an Accordion root.
 */
export function useAccordionRootContext(): AccordionRootContextValue {
  const context = useContext(AccordionRootContext)
  if (!context) {
    throw new Error(
      'Base UI: Accordion parts must be placed within <Accordion.Root>.'
    )
  }
  return context
}

/**
 * Shared state for accordion parts nested under {@link AccordionRoot}.
 */
export interface AccordionRootContextValue {
  /** Whether the accordion ignores user interaction. */
  disabled: Accessor<boolean>
  /**
   * Opens or closes an item identified by `itemValue`.
   *
   * @param itemValue - Item value being toggled.
   * @param nextOpen - Whether the item should be open after the change.
   * @param eventDetails - Cancelable change-event details.
   */
  handleValueChange: (
    itemValue: AccordionValue[number],
    nextOpen: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
  /** Root `hiddenUntilFound` (panels inherit unless overridden). */
  hiddenUntilFound: Accessor<boolean>
  /** Root `keepMounted` (panels inherit unless overridden). */
  keepMounted: Accessor<boolean>
  /** Public state bag for render props / data attributes. */
  state: AccordionRootState
  /** Currently open item values. */
  value: Accessor<AccordionValue>
  /**
   * Registers an item key for `data-index` ordering.
   *
   * @param key - Stable item registration key.
   * @returns Unregister cleanup.
   */
  registerItem: (key: string) => () => void
  /** Ordered list of registered item keys. */
  itemKeys: Accessor<Array<string>>
}
