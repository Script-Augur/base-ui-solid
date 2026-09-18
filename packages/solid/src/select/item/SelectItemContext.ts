import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Context published by {@link SelectItem} to its `Select.ItemText` /
 * `Select.ItemIndicator` children.
 */
export const SelectItemContext = createContext<SelectItemContextValue>()

/**
 * Reads the nearest {@link SelectItem} context.
 *
 * @returns Item context value.
 */
export function useSelectItemContext(): SelectItemContextValue {
  const context = useContext(SelectItemContext)
  if (context == null) {
    throw new Error(
      'Base UI: Select.Item parts must be used within <Select.Item>.'
    )
  }
  return context
}

/** Context value from {@link SelectItem}. */
export interface SelectItemContextValue {
  selected: Accessor<boolean>
  index: Accessor<number>
}
