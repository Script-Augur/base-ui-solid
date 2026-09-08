import { Timeout } from '@script-augur/base-ui-utils'
import { onCleanup } from 'solid-js'

import { DEFAULT_VALIDITY_STATE } from '../../internals/field-constants/constants'
import { useFormContext } from '../../internals/form-context/FormContext'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData'

import type { FieldRootState, FieldValidityData } from './FieldRoot'
import type { FormValues } from '../../internals/form-context/FormContext'
import type { HTMLProps } from '../../internals/labelable-provider/LabelableContext'
import type { Accessor, Setter } from 'solid-js'

const EMPTY_OBJECT: HTMLProps = {}
const validityKeys = Object.keys(DEFAULT_VALIDITY_STATE) as Array<
  keyof ValidityState
>
/**
 * Whether an input participates in the surrounding Base UI Form.
 */
export function isEligibleInput(
  input: HTMLInputElement,
  formElement: HTMLFormElement | null
) {
  if (input.matches(':disabled')) {
    return false
  }

  if (!formElement || input.form === formElement) {
    return true
  }

  return input.form === null && !input.hasAttribute('form')
}
/**
 * Solid port of `useFieldValidation` — native + custom validation for Field.
 */
export function createFieldValidation(
  params: CreateFieldValidationParameters
): CreateFieldValidationReturnValue {
  const { elementRef, formRef } = useFormContext()

  const { controlId, getDescriptionProps } = useLabelableContext()

  const timeout = new Timeout()
  onCleanup(() => timeout.clear())

  const inputRef: { current: HTMLInputElement | null } = { current: null }
  const registeredInputs: RegisteredInputs = new Map()
  let validationCommitId = 0

  const registerInput = (
    element: HTMLInputElement,
    registration: RegisteredInput
  ) => {
    registeredInputs.set(element, registration)
    return () => {
      registeredInputs.delete(element)
    }
  }

  const getInputControl = () => {
    const element = findRepresentativeInput(
      registeredInputs,
      elementRef.current
    )
    return (
      (element && registeredInputs.get(element)?.controlRef.current) || null
    )
  }

  const commit = async (value: unknown, revalidate = false) => {
    validationCommitId += 1
    const thisCommitId = validationCommitId

    function updateRegisteredFieldValidity(
      nextValidityData: FieldValidityData,
      externalInvalid = params.invalid()
    ) {
      const fieldId = params.registeredFieldIdRef.current ?? controlId()
      if (fieldId == null) {
        return
      }

      const currentFieldData = formRef.current.fields.get(fieldId)
      if (!currentFieldData) {
        return
      }

      const validityDataWithFormErrors = getCombinedFieldValidityData(
        nextValidityData,
        externalInvalid
      )

      formRef.current.fields.set(fieldId, {
        ...currentFieldData,
        validityData: validityDataWithFormErrors,
      })
    }

    function publishAllValid(
      input: HTMLInputElement | null,
      externalInvalid?: boolean
    ) {
      const nextValidityData = {
        value,
        state: { ...DEFAULT_VALIDITY_STATE, valid: true },
        error: '',
        errors: [] as Array<string>,
        initialValue: params.validityData().initialValue,
      }
      clearCustomValidity(input, registeredInputs)
      updateRegisteredFieldValidity(nextValidityData, externalInvalid)
      params.validityDataAssign(nextValidityData)
    }

    const element =
      registeredInputs.size > 0
        ? findRepresentativeInput(registeredInputs, elementRef.current)
        : inputRef.current

    if (revalidate) {
      if (params.state.valid !== false || !element) {
        return
      }

      const currentNativeValidity = element.validity

      if (!currentNativeValidity.valueMissing) {
        publishAllValid(element, false)
        return
      }

      for (const key of validityKeys) {
        if (
          key !== 'valid' &&
          key !== 'valueMissing' &&
          key !== 'customError' &&
          currentNativeValidity[key]
        ) {
          return
        }
      }
    }

    function getState(el: HTMLInputElement) {
      const computedState = validityKeys.reduce(
        (acc, key) => {
          acc[key] = el.validity[key]
          return acc
        },
        {} as Record<keyof ValidityState, boolean>
      )

      let hasOnlyValueMissingError = false

      for (const key of validityKeys) {
        if (key === 'valid') {
          continue
        }
        if (key === 'valueMissing' && computedState[key]) {
          hasOnlyValueMissingError = true
        } else if (computedState[key]) {
          return computedState
        }
      }

      if (hasOnlyValueMissingError && !params.markedDirtyRef.current) {
        computedState.valid = true
        computedState.valueMissing = false
      }
      return computedState
    }

    timeout.clear()

    let result: null | string | Array<string> = null
    let validationErrors: Array<string> = []

    const nextState: Record<keyof ValidityState, boolean> = element
      ? getState(element)
      : { ...DEFAULT_VALIDITY_STATE, valid: true }

    let defaultValidationMessage: string | undefined
    const isValidatingOnChange = params.shouldValidateOnChange()

    if (element && element.validationMessage && !isValidatingOnChange) {
      defaultValidationMessage = element.validationMessage
      validationErrors = [element.validationMessage]
    } else {
      const formValues = Array.from(formRef.current.fields.values()).reduce(
        (acc, field) => {
          if (field.name) {
            acc[field.name] = field.getValue()
          }
          return acc
        },
        {} as FormValues
      )

      const resultOrPromise = params.validate(value, formValues)
      if (
        typeof resultOrPromise === 'object' &&
        resultOrPromise !== null &&
        'then' in resultOrPromise
      ) {
        result = await resultOrPromise
        if (thisCommitId !== validationCommitId) {
          return
        }
      } else {
        result = resultOrPromise
      }

      if (result !== null) {
        nextState.valid = false
        nextState.customError = true

        if (Array.isArray(result)) {
          validationErrors = result
          element?.setCustomValidity(result.join('\n'))
        } else if (result) {
          validationErrors = [result]
          element?.setCustomValidity(result)
        }
      } else if (isValidatingOnChange) {
        clearCustomValidity(element, registeredInputs)
        nextState.customError = false

        if (element && element.validationMessage) {
          defaultValidationMessage = element.validationMessage
          validationErrors = [element.validationMessage]
        } else if ((!element || element.validity.valid) && !nextState.valid) {
          nextState.valid = true
        }
      }
    }

    const nextValidityData: FieldValidityData = {
      value,
      state: nextState,
      error:
        defaultValidationMessage ??
        (Array.isArray(result) ? (result[0] ?? '') : (result ?? '')),
      errors: validationErrors,
      initialValue: params.validityData().initialValue,
    }

    updateRegisteredFieldValidity(nextValidityData)
    params.validityDataAssign(nextValidityData)
  }

  const change = (value: unknown) => {
    timeout.clear()
    const validateOnChange = params.shouldValidateOnChange()
    const debounceMs = params.validationDebounceTime()

    if (validateOnChange && value !== '' && debounceMs) {
      validationCommitId += 1
      timeout.start(debounceMs, () => {
        void commit(value)
      })
    } else {
      void commit(value, !validateOnChange)
    }
  }

  const getValidationProps = (
    controlDisabled: boolean,
    externalProps: HTMLProps = EMPTY_OBJECT
  ) => {
    const described = getDescriptionProps(externalProps)
    return {
      ...described,
      get 'aria-invalid'() {
        return params.state.valid === false &&
          !params.state.disabled &&
          !controlDisabled
          ? true
          : undefined
      },
    }
  }

  return {
    getValidationProps,
    inputRef,
    registeredInputs,
    registerInput,
    getInputControl,
    commit,
    change,
  }
}
export type RegisteredInput = {
  controlRef: { current: HTMLElement | null }
  value: string | undefined
}
export type RegisteredInputs = Map<HTMLInputElement, RegisteredInput>
export interface CreateFieldValidationParameters {
  validityDataAssign: Setter<FieldValidityData>
  validate: (
    value: unknown,
    formValues: FormValues
  ) => string | Array<string> | null | Promise<string | Array<string> | null>
  validityData: Accessor<FieldValidityData>
  validationDebounceTime: Accessor<number>
  invalid: Accessor<boolean>
  markedDirtyRef: { current: boolean }
  state: FieldRootState
  shouldValidateOnChange: () => boolean
  registeredFieldIdRef: { current: string | undefined }
}
export interface CreateFieldValidationReturnValue {
  getValidationProps: (disabled: boolean, props?: HTMLProps) => HTMLProps
  inputRef: { current: HTMLInputElement | null }
  registeredInputs: RegisteredInputs
  registerInput: (
    element: HTMLInputElement,
    registration: RegisteredInput
  ) => void | (() => void)
  getInputControl: () => HTMLElement | null
  commit: (value: unknown, revalidate?: boolean) => Promise<void>
  change: (value: unknown) => void
}
function findRepresentativeInput(
  inputs: RegisteredInputs,
  formElement: HTMLFormElement | null
): HTMLInputElement | null {
  let fallback: HTMLInputElement | null = null
  for (const input of inputs.keys()) {
    if (!isEligibleInput(input, formElement)) {
      continue
    }
    if (!input.validity.valid) {
      return input
    }
    fallback ??= input
  }
  return fallback
}
function clearCustomValidity(
  element: HTMLInputElement | null,
  inputs: RegisteredInputs
) {
  for (const input of inputs.keys()) {
    input.setCustomValidity('')
  }
  element?.setCustomValidity('')
}
