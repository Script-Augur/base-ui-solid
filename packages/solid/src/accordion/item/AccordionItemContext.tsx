import { createContext, useContext } from 'solid-js'

import type { AccordionItemState } from './AccordionItem'
import type { Accessor, Setter } from 'solid-js'

const AccordionItemContext = createContext<
  AccordionItemContextValue | undefined
>(undefined)

export { AccordionItemContext }

/**
 * Reads the nearest {@link AccordionItem} context.
 *
 * @returns Context value.
 * @throws If used outside an Accordion item.
 */
export function useAccordionItemContext(): AccordionItemContextValue {
  const context = useContext(AccordionItemContext)
  if (!context) {
    throw new Error(
      'Base UI: Accordion parts must be placed within <Accordion.Item>.'
    )
  }
  return context
}

/**
 * Shared state for accordion parts nested under {@link AccordionItem}.
 */
export interface AccordionItemContextValue {
  /** Generated fallback trigger id when the trigger does not set `id`. */
  defaultTriggerId: string
  /** Whether this item's panel is open. */
  open: Accessor<boolean>
  /** Public state bag for render props / data attributes. */
  state: AccordionItemState
  /** Registers the active trigger id (`null` when the trigger unmounts). */
  triggerIdAssign: Setter<string | null | undefined>
  /** Active trigger id for `aria-labelledby` (undefined when unregistered). */
  triggerId: Accessor<string | undefined>
}
