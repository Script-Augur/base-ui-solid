import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

const FieldItemContext = createContext<FieldItemContextValue>({
  disabled: () => false,
})
export { FieldItemContext }
/**
 * Reads the nearest {@link FieldItem} context (defaults when absent).
 */
export function useFieldItemContext(): FieldItemContextValue {
  return useContext(FieldItemContext)
}
export interface FieldItemContextValue {
  disabled: Accessor<boolean>
}
