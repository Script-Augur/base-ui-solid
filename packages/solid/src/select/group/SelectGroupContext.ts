import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Context published by {@link SelectGroup} to its {@link SelectGroupLabel} child.
 */
export const SelectGroupContext = createContext<SelectGroupContextValue>()

/**
 * Reads the nearest {@link SelectGroup} context.
 *
 * @returns Group context value.
 */
export function useSelectGroupContext(): SelectGroupContextValue {
  const context = useContext(SelectGroupContext)
  if (context == null) {
    throw new Error(
      'Base UI: Select.GroupLabel must be used within <Select.Group>.'
    )
  }
  return context
}

/** Context value from {@link SelectGroup}. */
export interface SelectGroupContextValue {
  labelId: Accessor<string | undefined>
  labelIdAssign: (id: string | undefined) => void
}
