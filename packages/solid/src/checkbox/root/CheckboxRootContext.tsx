import { createContext, useContext } from 'solid-js'

import type { CheckboxRootState } from './CheckboxRoot'

export const CheckboxRootContext =
  createContext<CheckboxRootContextValue | null>(null)
/**
 * Reads the nearest Checkbox root context.
 *
 * @returns The checkbox root state.
 * @throws If used outside `<Checkbox.Root>`.
 */
export function useCheckboxRootContext(): CheckboxRootContextValue {
  const context = useContext(CheckboxRootContext)
  if (context === null) {
    throw new Error(
      'Base UI: CheckboxRootContext is missing. Checkbox parts must be placed within <Checkbox.Root>.'
    )
  }
  return context
}
export type CheckboxRootContextValue = CheckboxRootState
