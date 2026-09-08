import { activeElement, ownerDocument } from '@script-augur/base-ui-utils'
import { createEffect, mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'
import { fieldValidityMapping } from '../../internals/field-constants/constants'
import { createRegisterFieldControl } from '../../internals/field-register-control/createRegisterFieldControl'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../../internals/form-context/FormContext'
import { createLabelableId } from '../../internals/labelable-provider/createLabelableId'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { dataAttr } from '../../internals/useRender'

import type { BaseUIChangeEventDetails } from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { FieldRootState } from '../root/FieldRoot'
import type { JSX } from 'solid-js'

/**
 * The form control to label and validate.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldControl(componentProps: FieldControlProps): JSX.Element {
  const inputRef: { current: HTMLElement | null } = { current: null }

  const field = useFieldRootContext()
  const { clearErrors } = useFormContext()
  const { labelId, getDescriptionProps } = useLabelableContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'name',
    'value',
    'disabled',
    'onValueChange',
    'defaultValue',
    'autofocus',
    'autoFocus',
    'ref',
  ])

  const id = createLabelableId({ id: () => local.id })
  const name = () => field.name() ?? local.name
  const disabled = () => field.disabled() || Boolean(local.disabled)
  const autoFocus = () => Boolean(local.autoFocus ?? local.autofocus)

  const state: FieldControlState = {
    get disabled() {
      return disabled()
    },
    get touched() {
      return field.state.touched
    },
    get dirty() {
      return field.state.dirty
    },
    get valid() {
      return field.state.valid
    },
    get filled() {
      return field.state.filled
    },
    get focused() {
      return field.state.focused
    },
  }
  const [valueUnwrapped] = createControlled({
    name: () => name(),
    value: () => local.value,
    defaultValue: (local.defaultValue as string | undefined) ?? '',
  })

  const isControlled = () => local.value !== undefined
  const value = () => (isControlled() ? valueUnwrapped() : undefined)
  const getValueFromInput = () =>
    field.validation.inputRef.current?.value ??
    (inputRef.current as HTMLInputElement | null)?.value

  createRegisterFieldControl({
    controlRef: field.validation.inputRef,
    id,
    value: () => value(),
    getFormValueOverride: () => getValueFromInput,
    enabled: () => !disabled(),
    name: () => local.name,
  })

  createEffect(() => {
    const valueProp = local.value
    const hasExternalValue = valueProp != null
    if (
      field.validation.inputRef.current?.value ||
      (hasExternalValue && valueProp !== '')
    ) {
      field.filledAssign(true)
    } else if (hasExternalValue) {
      field.filledAssign(false)
    }
  })
  createEffect(() => {
    if (
      autoFocus() &&
      inputRef.current === activeElement(ownerDocument(inputRef.current))
    ) {
      field.focusedAssign(true)
    }
  })

  return createRender<FieldControlState, Record<string, unknown>>({
    defaultElement: 'input',
    state,
    render: local.render,
    stateAttributesMapping: fieldValidityMapping,
    ref: [
      local.ref as ((el: Element) => void) | undefined,
      assignInputRef,
      field.validation.inputRef,
    ],
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return id()
      },
      get disabled() {
        return disabled()
      },
      get name() {
        return name()
      },
      get 'aria-labelledby'() {
        return labelId()
      },
      get 'aria-describedby'() {
        const external = (elementProps as Record<string, unknown>)[
          'aria-describedby'
        ]
        return getDescriptionProps(
          external != null ? { 'aria-describedby': external } : {}
        )['aria-describedby']
      },
      get 'aria-invalid'() {
        return field.state.valid === false && !disabled() ? true : undefined
      },
      get autofocus() {
        return autoFocus() || undefined
      },
      get value() {
        return isControlled() ? value() : undefined
      },
      get 'attr:value'() {
        return isControlled() ? undefined : local.defaultValue
      },
      onInput(event: InputEvent & { currentTarget: HTMLInputElement }) {
        handleControlValueEvent(event)
      },
      onChange(event: Event & { currentTarget: HTMLInputElement }) {
        handleControlValueEvent(event)
      },
      onFocus() {
        field.focusedAssign(true)
      },
      onBlur(event: FocusEvent & { currentTarget: HTMLInputElement }) {
        field.touchedAssign(true)
        field.focusedAssign(false)

        if (field.validationMode() === 'onBlur') {
          void field.validation.commit(event.currentTarget.value)
        }
      },
      onKeyDown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
        if (event.currentTarget.tagName === 'INPUT' && event.key === 'Enter') {
          field.touchedAssign(true)
          void field.validation.commit(event.currentTarget.value)
        }
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get 'data-disabled'() {
        return dataAttr(disabled())
      },
      get 'data-touched'() {
        return dataAttr(field.state.touched)
      },
      get 'data-dirty'() {
        return dataAttr(field.state.dirty)
      },
      get 'data-filled'() {
        return dataAttr(field.state.filled)
      },
      get 'data-focused'() {
        return dataAttr(field.state.focused)
      },
    }),
  })

  function assignInputRef(el: Element | null | undefined) {
    const node = (el as HTMLInputElement | null) ?? null
    inputRef.current = node
    if (
      node &&
      !isControlled() &&
      local.defaultValue != null &&
      node.value === ''
    ) {
      node.value = String(local.defaultValue)
    }
  }
  function handleControlValueEvent(
    event: Event & { currentTarget: HTMLInputElement }
  ) {
    const inputValue = event.currentTarget.value
    local.onValueChange?.(
      inputValue,
      createChangeEventDetails(REASONS.none, event)
    )
    field.dirtyAssign(inputValue !== (field.validityData().initialValue ?? ''))
    field.filledAssign(inputValue !== '')

    if (!event.defaultPrevented) {
      clearErrors(name())
      field.validation.change(inputValue)
    }
  }
}

export interface FieldControlState extends FieldRootState {}

export type FieldControlProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> & {
  value?: string | undefined
  defaultValue?: string | number | Array<string> | undefined
  onValueChange?:
    | ((value: string, eventDetails: FieldControlChangeEventDetails) => void)
    | undefined
  /** React-compat alias for Solid `autofocus`. */
  autoFocus?: boolean | undefined
  render?: RenderProp<FieldControlState, Record<string, unknown>>
}

export type FieldControlChangeEventReason = typeof REASONS.none

export type FieldControlChangeEventDetails =
  BaseUIChangeEventDetails<FieldControlChangeEventReason>
