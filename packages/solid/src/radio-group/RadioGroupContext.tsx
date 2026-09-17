import { createContext, useContext } from 'solid-js'

import type {
  BaseUIChangeEventDetails,
  REASONS,
} from '../internals/createChangeEventDetails'
import type { useFieldRootContext } from '../internals/field-root-context/FieldRootContext'
import type { Accessor, Setter } from 'solid-js'

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(
  undefined
)
export { RadioGroupContext }
/**
 * Reads the nearest Radio Group context (optional outside a group).
 */
export function useRadioGroupContext<TValue = unknown>():
  RadioGroupContextValue<TValue> | undefined {
  return useContext(RadioGroupContext) as
    RadioGroupContextValue<TValue> | undefined
}
export interface RadioGroupContextValue<TValue = unknown> {
  disabled: Accessor<boolean | undefined>
  readOnly: Accessor<boolean | undefined>
  required: Accessor<boolean | undefined>
  form: Accessor<string | undefined>
  name: Accessor<string | undefined>
  checkedValue: Accessor<TValue | undefined>
  setCheckedValue: (
    value: TValue,
    eventDetails: BaseUIChangeEventDetails<(typeof REASONS)['none']>
  ) => void
  touched: Accessor<boolean>
  touchedAssign: Setter<boolean>
  validation: ReturnType<typeof useFieldRootContext>['validation'] | undefined
  registerInputRef: (element: HTMLInputElement | null) => void | (() => void)
}
