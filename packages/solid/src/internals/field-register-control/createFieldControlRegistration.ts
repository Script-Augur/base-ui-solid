import { createEffect, onCleanup } from 'solid-js'

import { getCombinedFieldValidityData } from '../../field/utils/getCombinedFieldValidityData'
import { useFormContext } from '../form-context/FormContext'

import type { FieldValidityData } from '../../field/root/FieldRoot'
import type { Accessor, Setter } from 'solid-js'
/**
 * Solid port of `useFieldControlRegistration` — keeps the Form field registry
 * in sync with the active control registration.
 */
export function createFieldControlRegistration(
  params: CreateFieldControlRegistrationParameters
): readonly [
  () => void,
  (source: symbol, registration: FieldControlRegistration | undefined) => void,
] {
  const { formRef } = useFormContext()

  let activeFieldControlSource: symbol | null = null
  let registrationCurrent: FieldControlRegistration | null = null
  let initialValueCaptured = false

  const getValueForForm = () => {
    const registration = registrationCurrent
    if (!registration) return undefined

    if (registration.getValue) {
      return registration.getValue()
    }

    return registration.value
  }

  function getRegistrationValue(registration: FieldControlRegistration) {
    return registration.value === undefined
      ? getValueForForm()
      : registration.value
  }

  const validate = () => {
    const registration = registrationCurrent
    params.markedDirtyRef.current = true

    if (!registration) {
      void params.commit(params.validityData().value)
      return
    }

    void params.commit(getRegistrationValue(registration))
  }

  function refreshRegistration() {
    const registration = registrationCurrent
    if (!registration || !registration.id) return

    formRef.current.fields.set(registration.id, {
      getValue: getValueForForm,
      name: params.name() ?? registration.name,
      controlRef: registration.controlRef,
      validityData: getCombinedFieldValidityData(
        params.validityData(),
        params.invalid()
      ),
      validate,
    })
  }

  function deleteRegistration(id = registrationCurrent?.id) {
    if (id) {
      formRef.current.fields.delete(id)
    }
  }

  function captureInitialValue(registration: FieldControlRegistration) {
    if (initialValueCaptured) return

    initialValueCaptured = true
    const initialValue = getRegistrationValue(registration)

    params.validityDataAssign(prev =>
      prev.initialValue === initialValue ? prev : { ...prev, initialValue }
    )
  }

  createEffect(() => {
    const registration = registrationCurrent
    const name = params.name()
    const invalid = params.invalid()
    const validityData = params.validityData()

    if (!registration || !registration.id) return

    params.registeredFieldNameAssign(name ? undefined : registration.name)

    formRef.current.fields.set(registration.id, {
      getValue: getValueForForm,
      name: name ?? registration.name,
      controlRef: registration.controlRef,
      validityData: getCombinedFieldValidityData(validityData, invalid),
      validate,
    })
  })

  createEffect(() => {
    const fields = formRef.current.fields
    onCleanup(() => {
      const id = registrationCurrent?.id
      if (id) {
        fields.delete(id)
      }
    })
  })

  const register = (
    source: symbol,
    registration: FieldControlRegistration | undefined
  ) => {
    if (!registration) {
      if (activeFieldControlSource === source) {
        activeFieldControlSource = null
        deleteRegistration()
        registrationCurrent = null
        params.registeredFieldNameAssign(undefined)
        params.registeredFieldIdRef.current = undefined
      }
      return
    }

    const previousId = registrationCurrent?.id

    activeFieldControlSource = source
    registrationCurrent = registration
    if (!params.name()) {
      params.registeredFieldNameAssign(registration.name)
    }
    params.registeredFieldIdRef.current = registration.id

    if (previousId && previousId !== registration.id) {
      deleteRegistration(previousId)
    }

    captureInitialValue(registration)
    refreshRegistration()
  }

  return [validate, register] as const
}
/** Registration payload for a field control participating in Form. */
export interface FieldControlRegistration {
  controlRef: { current: HTMLElement | null }
  id: string | undefined
  name?: string | undefined
  getValue?: (() => unknown) | undefined
  value: unknown
}
export interface CreateFieldControlRegistrationParameters {
  commit: (value: unknown) => void | Promise<void>
  invalid: Accessor<boolean>
  markedDirtyRef: { current: boolean }
  name: Accessor<string | undefined>
  registeredFieldNameAssign: Setter<string | undefined>
  registeredFieldIdRef: { current: string | undefined }
  validityDataAssign: Setter<FieldValidityData>
  validityData: Accessor<FieldValidityData>
}
