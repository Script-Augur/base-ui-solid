import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

const FieldsetRootContext = createContext<FieldsetRootContextValue | undefined>(
  undefined
)
export { FieldsetRootContext }
/**
 * Reads the nearest Fieldset root context.
 *
 * @param optional - When `true`, returns `undefined` outside a Fieldset.
 */
export function useFieldsetRootContext(
  optional = false
): FieldsetRootContextValue | undefined {
  const context = useContext(FieldsetRootContext)

  if (context == null && !optional) {
    throw new Error(
      'Base UI: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.'
    )
  }

  return context
}
/**
 * Minimal Fieldset root context so Field can inherit `disabled`.
 * Full Fieldset component lands in a later slice.
 */
export interface FieldsetRootContextValue {
  disabled: Accessor<boolean | undefined>
}
