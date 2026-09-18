import { createContext, useContext } from 'solid-js'

export const ComboboxChipsContext = createContext<ComboboxChipsContextValue>()

export function useComboboxChipsContext(): ComboboxChipsContextValue {
  return useContext(ComboboxChipsContext) ?? {}
}

export interface ComboboxChipsContextValue {}
