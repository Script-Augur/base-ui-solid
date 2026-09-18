import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Context published by {@link ComboboxGroup} to its {@link ComboboxGroupLabel} child.
 */
export const ComboboxGroupContext = createContext<ComboboxGroupContextValue>()

/**
 * Reads the nearest {@link ComboboxGroup} context.
 *
 * @returns Group context value.
 */
export function useComboboxGroupContext(): ComboboxGroupContextValue {
  const context = useContext(ComboboxGroupContext)
  if (context == null) {
    throw new Error(
      'Base UI: Combobox.GroupLabel must be used within <Combobox.Group>.'
    )
  }
  return context
}

/** Context value from {@link ComboboxGroup}. */
export interface ComboboxGroupContextValue {
  labelId: Accessor<string | undefined>
  labelIdAssign: (id: string | undefined) => void
}
