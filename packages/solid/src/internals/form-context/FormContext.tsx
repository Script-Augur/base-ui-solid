import { createContext, useContext } from 'solid-js'

import { NOOP } from '../noop'

import type { FieldValidityData } from '../../field/root/FieldRoot'
import type { Accessor } from 'solid-js'

/** Default Form context used when Field is rendered outside `<Form>`. */
export const DEFAULT_FORM_CONTEXT: FormContextValue = {
  elementRef: { current: null },
  formRef: {
    current: {
      fields: new Map(),
    },
  },
  errors: () => ({}),
  clearErrors: NOOP,
  validationMode: 'onSubmit',
  submitAttemptedRef: {
    current: false,
  },
}

export const FormContext = createContext<FormContextValue>(DEFAULT_FORM_CONTEXT)
/**
 * Reads the nearest Form context (defaults when no Provider is present).
 */
export function useFormContext(): FormContextValue {
  return useContext(FormContext)
}
/** Map of field name → error message(s) from a surrounding Form. */
export type Errors = Record<string, string | Array<string>>
/** When field validation runs relative to form submit / blur / change. */
export type ValidationMode = 'onSubmit' | 'onBlur' | 'onChange'
/** Submitted / aggregated form values keyed by field name. */
export type FormValues = Record<string, unknown>
/** Registry entry for a field control participating in a Form. */
export interface FormFieldRegistration {
  name: string | undefined
  /**
   * After this returns, the field registry entry reflects the latest synchronous
   * validity verdict. Async validators do not block submit.
   */
  validate: () => void
  validityData: FieldValidityData
  controlRef: { current: HTMLElement | null }
  getValue: () => unknown
}
/**
 * Context shared by Form and Field.
 *
 * Reactive fields use accessors so Solid consumers stay up to date when Form
 * later provides a real Provider.
 */
export interface FormContextValue {
  errors: Accessor<Errors>
  clearErrors: (name: string | undefined) => void
  elementRef: { current: HTMLFormElement | null }
  formRef: {
    current: {
      fields: Map<string, FormFieldRegistration>
    }
  }
  validationMode: ValidationMode
  submitAttemptedRef: { current: boolean }
}
