import { createContext, useContext } from 'solid-js'

import {
  DEFAULT_FIELD_ROOT_STATE,
  DEFAULT_VALIDITY_STATE,
} from '../field-constants/constants'
import { NOOP } from '../noop'

import type { CreateFieldValidationReturnValue } from '../../field/root/createFieldValidation'
import type {
  FieldRootState,
  FieldValidityData,
} from '../../field/root/FieldRoot'
import type { FieldControlRegistration } from '../field-register-control/createFieldControlRegistration'
import type { ValidationMode } from '../form-context/FormContext'
import type { HTMLProps } from '../labelable-provider/LabelableContext'
import type { Accessor, Setter } from 'solid-js'

const EMPTY_OBJECT: HTMLProps = {}
/** Default Field root context used outside `<Field.Root>`. */
export const DEFAULT_FIELD_ROOT_CONTEXT: FieldRootContextValue = {
  invalid: () => false,
  name: () => undefined,
  validityData: () => ({
    state: { ...DEFAULT_VALIDITY_STATE },
    errors: [],
    error: '',
    value: '',
    initialValue: null,
  }),
  validityDataAssign: NOOP,
  disabled: () => false,
  touchedAssign: NOOP,
  dirtyAssign: NOOP,
  filledAssign: NOOP,
  focusedAssign: NOOP,
  validationMode: () => 'onSubmit',
  shouldValidateOnChange: () => false,
  state: DEFAULT_FIELD_ROOT_STATE,
  registerFieldControl: NOOP,
  validation: {
    getValidationProps: (_disabled: boolean, props: HTMLProps = EMPTY_OBJECT) =>
      props,
    inputRef: { current: null },
    registeredInputs: new Map(),
    registerInput: NOOP,
    getInputControl: () => null,
    commit: async () => {},
    change: NOOP,
  },
}

export const FieldRootContext = createContext<FieldRootContextValue>(
  DEFAULT_FIELD_ROOT_CONTEXT
)
/**
 * Reads the nearest Field root context.
 *
 * @param optional - When `false`, throws if no real Field.Root Provider is present.
 */
export function useFieldRootContext(optional = true): FieldRootContextValue {
  const context = useContext(FieldRootContext)

  if (context.validityDataAssign === NOOP && !optional) {
    throw new Error(
      'Base UI: FieldRootContext is missing. Field parts must be placed within <Field.Root>.'
    )
  }

  return context
}
/**
 * Context value provided by {@link FieldRoot}.
 */
export interface FieldRootContextValue {
  invalid: Accessor<boolean>
  name: Accessor<string | undefined>
  validityData: Accessor<FieldValidityData>
  validityDataAssign: Setter<FieldValidityData>
  disabled: Accessor<boolean>
  touchedAssign: (value: boolean | ((prev: boolean) => boolean)) => void
  dirtyAssign: (value: boolean | ((prev: boolean) => boolean)) => void
  filledAssign: Setter<boolean>
  focusedAssign: Setter<boolean>
  validationMode: Accessor<ValidationMode>
  shouldValidateOnChange: () => boolean
  state: FieldRootState
  registerFieldControl: (
    source: symbol,
    registration: FieldControlRegistration | undefined
  ) => void
  validation: CreateFieldValidationReturnValue
}
