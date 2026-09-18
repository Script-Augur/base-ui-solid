import { createContext, useContext } from 'solid-js'

export const ComboboxChipContext = createContext<ComboboxChipContextValue>()

export function useComboboxChipContext(): ComboboxChipContextValue {
  return useContext(ComboboxChipContext) ?? {}
}

export interface ComboboxChipContextValue {}
