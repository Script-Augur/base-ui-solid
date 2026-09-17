import { createEffect, createUniqueId, mergeProps, splitProps } from 'solid-js'

import { isEligibleInput } from '../field/root/createFieldValidation'
import { createControlled } from '../internals/createControlled'
import { createRender } from '../internals/createRender'
import { fieldValidityMapping } from '../internals/field-constants/constants'
import { createRegisterFieldControl } from '../internals/field-register-control/createRegisterFieldControl'
import { useFieldRootContext } from '../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../internals/form-context/FormContext'
import { useLabelableContext } from '../internals/labelable-provider/LabelableContext'
import { dataAttr } from '../internals/useRender'

import { CheckboxGroupContext } from './CheckboxGroupContext'
import { CheckboxGroupDataAttributes } from './CheckboxGroupDataAttributes'
import { useCheckboxGroupParent } from './useCheckboxGroupParent'

import type { FieldRootState } from '../field/root/FieldRoot'
import type {
  BaseUIChangeEventDetails,
  REASONS,
} from '../internals/createChangeEventDetails'
import type { RenderProp } from '../internals/createRender'
import type { JSX } from 'solid-js'

const EMPTY_ARRAY: Array<string> = []

/**
 * Provides a shared state to a series of checkboxes.
 * Renders a `<div>` with `role="group"`.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 *
 * @param componentProps - Checkbox group props.
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Checkbox } from "@script-augur/base-ui-solid/checkbox"
 * import { CheckboxGroup } from "@script-augur/base-ui-solid/checkbox-group"
 *
 * <CheckboxGroup defaultValue={["email"]}>
 *   <Checkbox.Root value="email" />
 *   <Checkbox.Root value="sms" />
 * </CheckboxGroup>
 * ```
 */
export function CheckboxGroup(componentProps: CheckboxGroupProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'allValues',
    'class',
    'style',
    'defaultValue',
    'disabled',
    'id',
    'onValueChange',
    'render',
    'value',
    'ref',
    'children',
  ])

  const field = useFieldRootContext()
  const { labelId, getDescriptionProps } = useLabelableContext()
  const { clearErrors, elementRef } = useFormContext()

  const disabled = () => field.disabled() || (local.disabled ?? false)

  const [value, valueAssign] = createControlled({
    value: () => local.value,
    defaultValue: local.defaultValue ?? EMPTY_ARRAY,
  })

  // When a controlled `value` becomes `undefined`, createControlled falls back
  // to the empty default; group consumers always see an array.
  const groupValue = value

  function setValue(
    next: Array<string>,
    eventDetails: CheckboxGroupChangeEventDetails
  ) {
    local.onValueChange?.(next, eventDetails)
    if (eventDetails.isCanceled) return
    valueAssign(next)
  }

  const parent = useCheckboxGroupParent({
    allValues: local.allValues,
    value: groupValue,
    onValueChange: setValue,
  })

  const generatedId = createUniqueId()
  const fieldControlId = () => local.id ?? generatedId

  const controlRef: { current: HTMLElement | null } = {
    get current() {
      return field.validation.getInputControl()
    },
    set current(_element: HTMLElement | null) {
      // Representative control comes from registered inputs.
    },
  }

  function getFormValue() {
    const formElement = elementRef.current
    const current = groupValue()
    if (!formElement) return current

    const successfulValues = new Set<string>()
    for (const [input, registration] of field.validation.registeredInputs) {
      if (
        registration.value !== undefined &&
        input.checked &&
        isEligibleInput(input, formElement)
      ) {
        successfulValues.add(registration.value)
      }
    }
    return current.filter(inputValue => successfulValues.has(inputValue))
  }

  createRegisterFieldControl({
    controlRef,
    id: fieldControlId,
    value: groupValue,
    getFormValueOverride: () => getFormValue,
    enabled: () => Boolean(field.name()) && !disabled(),
    name: () => field.name(),
  })

  createEffectOnValueChange(groupValue, () => {
    const fieldName = field.name()
    if (fieldName) clearErrors(fieldName)
    const current = groupValue()
    const initialValue = Array.isArray(field.validityData().initialValue)
      ? (field.validityData().initialValue as Array<string>)
      : EMPTY_ARRAY
    field.filledAssign(current.length > 0)
    field.dirtyAssign(!areArraysEqual(current, initialValue))
    field.validation.change(current)
  })

  const state: CheckboxGroupState = {
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

  const contextValue = {
    allValues: () => local.allValues,
    value: groupValue,
    setValue,
    parent,
    disabled,
    validation: field.validation,
  }

  return (
    <CheckboxGroupContext.Provider value={contextValue}>
      {createRender<CheckboxGroupState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        stateAttributesMapping: fieldValidityMapping,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get id() {
            return local.id
          },
          role: 'group' as const,
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
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get [CheckboxGroupDataAttributes.disabled]() {
            return dataAttr(disabled())
          },
          get children() {
            return local.children
          },
          ref: local.ref,
        }),
      })}
    </CheckboxGroupContext.Provider>
  )
}

/**
 * Public state exposed to `render` functions.
 */
export interface CheckboxGroupState extends FieldRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean
}

/**
 * Props for {@link CheckboxGroup}.
 */
export interface CheckboxGroupProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /**
   * Names of the checkboxes in the group that should be ticked.
   *
   * To render an uncontrolled checkbox group, use the `defaultValue` prop instead.
   */
  value?: Array<string> | undefined
  /**
   * Names of the checkboxes in the group that should be initially ticked.
   *
   * To render a controlled checkbox group, use the `value` prop instead.
   */
  defaultValue?: Array<string> | undefined
  /**
   * Event handler called when a checkbox in the group is ticked or unticked.
   * Provides the new value as an argument.
   */
  onValueChange?:
    | ((
        value: Array<string>,
        eventDetails: CheckboxGroupChangeEventDetails
      ) => void)
    | undefined
  /**
   * Names of all checkboxes in the group. Use this when creating a parent checkbox.
   */
  allValues?: Array<string> | undefined
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   */
  render?: RenderProp<CheckboxGroupState, Record<string, unknown>>
  /**
   * Ref to the group element.
   */
  ref?: ((element: Element) => void) | undefined
}

export type CheckboxGroupChangeEventReason = typeof REASONS.none
export type CheckboxGroupChangeEventDetails =
  BaseUIChangeEventDetails<CheckboxGroupChangeEventReason>

function areArraysEqual(
  a: ReadonlyArray<string>,
  b: ReadonlyArray<string>
): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Runs `onChange` when `getValue` changes after the initial read
 * (mirrors React `useValueChanged`).
 */
function createEffectOnValueChange(
  getValue: () => Array<string>,
  onChange: () => void
): void {
  createEffect((prev: Array<string> | undefined) => {
    const next = getValue().slice()
    if (prev !== undefined && !areArraysEqual(prev, next)) {
      onChange()
    }
    return next
  })
}
