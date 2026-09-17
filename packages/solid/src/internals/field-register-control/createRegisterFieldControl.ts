import { createEffect, onCleanup } from 'solid-js'

import { useFieldRootContext } from '../field-root-context/FieldRootContext'

import type { FieldControlRegistration } from './createFieldControlRegistration'
import type { Accessor } from 'solid-js'

/**
 * Registers the current control with the surrounding Field root (and Form).
 */
export function createRegisterFieldControl(params: {
  controlRef: FieldControlRegistration['controlRef']
  id: Accessor<string | undefined>
  value: Accessor<unknown>
  getFormValueOverride?: Accessor<
    FieldControlRegistration['getValue'] | undefined
  >
  enabled?: Accessor<boolean>
  name?: Accessor<string | undefined>
}): void {
  const { registerFieldControl } = useFieldRootContext()
  const source = Symbol()
  const enabled = () => params.enabled?.() ?? true

  // Re-register without unregistering first: re-registration with the same id
  // updates the form's fields Map entry in place.
  createEffect(() => {
    if (!enabled()) {
      registerFieldControl(source, undefined)
      return
    }

    const registration: FieldControlRegistration = {
      controlRef: params.controlRef,
      getValue: params.getFormValueOverride?.(),
      id: params.id(),
      name: params.name?.(),
      value: params.value(),
    }

    registerFieldControl(source, registration)
  })

  createEffect(() => {
    onCleanup(() => {
      registerFieldControl(source, undefined)
    })
  })
}
