import { createContext, useContext } from 'solid-js'

import type { Accessor, Setter } from 'solid-js'

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
  optional: true
): FieldsetRootContextValue | undefined
export function useFieldsetRootContext(
  optional?: false
): FieldsetRootContextValue
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
 * Shared state for fieldset parts nested under {@link FieldsetRoot}.
 */
export interface FieldsetRootContextValue {
  /** Id of the registered legend, used as `aria-labelledby` on the root. */
  legendId: Accessor<string | undefined>
  /** Registers / clears the legend element id. */
  legendIdAssign: Setter<string | undefined>
  /**
   * Whether the fieldset (and nested fields) should ignore user interaction.
   * Includes ancestor Fieldset disabled state.
   */
  disabled: Accessor<boolean>
}
