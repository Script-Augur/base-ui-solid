import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Context published by {@link ComboboxItem} to its `Combobox.ItemText` /
 * `Combobox.ItemIndicator` children.
 */
export const ComboboxItemContext = createContext<ComboboxItemContextValue>()

/**
 * Reads the nearest {@link ComboboxItem} context.
 *
 * @returns Item context value.
 */
export function useComboboxItemContext(): ComboboxItemContextValue {
  const context = useContext(ComboboxItemContext)
  if (context == null) {
    throw new Error(
      'Base UI: Combobox.Item parts must be used within <Combobox.Item>.'
    )
  }
  return context
}

/** Context value from {@link ComboboxItem}. */
export interface ComboboxItemContextValue {
  selected: Accessor<boolean>
  index: Accessor<number>
}
