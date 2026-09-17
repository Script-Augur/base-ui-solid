import { createContext, useContext } from 'solid-js'

import type { UseCheckboxGroupParentReturnValue } from './useCheckboxGroupParent'
import type { CreateFieldValidationReturnValue } from '../field/root/createFieldValidation'
import type { BaseUIChangeEventDetails } from '../internals/createChangeEventDetails'
import type { Accessor } from 'solid-js'

const CheckboxGroupContext = createContext<
  CheckboxGroupContextValue | undefined
>(undefined)
export { CheckboxGroupContext }
/**
 * Reads the nearest {@link CheckboxGroup} context, if any.
 *
 * @returns Context value, or `undefined` outside a checkbox group.
 */
export function useCheckboxGroupContext():
  CheckboxGroupContextValue | undefined {
  return useContext(CheckboxGroupContext)
}
/**
 * Shared state for checkboxes nested under {@link CheckboxGroup}.
 */
export interface CheckboxGroupContextValue {
  value: Accessor<Array<string>>
  setValue: (
    value: Array<string>,
    eventDetails: BaseUIChangeEventDetails<'none'>
  ) => void
  allValues: Accessor<Array<string> | undefined>
  parent: UseCheckboxGroupParentReturnValue
  disabled: Accessor<boolean>
  validation: CreateFieldValidationReturnValue
}
