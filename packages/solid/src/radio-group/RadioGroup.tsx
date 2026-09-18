import { contains } from '@script-augur/base-ui-utils'
import {
  createEffect,
  createSignal,
  createUniqueId,
  splitProps,
} from 'solid-js'

import { isEligibleInput } from '../field/root/createFieldValidation'
import { useFieldsetRootContext } from '../fieldset/root/FieldsetRootContext'
import { SHIFT } from '../internals/composite/composite'
import { CompositeRoot } from '../internals/composite/root/CompositeRoot'
import { createControlled } from '../internals/createControlled'
import { fieldValidityMapping } from '../internals/field-constants/constants'
import { createRegisterFieldControl } from '../internals/field-register-control/createRegisterFieldControl'
import { useFieldRootContext } from '../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../internals/form-context/FormContext'
import { useLabelableContext } from '../internals/labelable-provider/LabelableContext'
import { dataAttr } from '../internals/useRender'

import { RadioGroupContext } from './RadioGroupContext'
import { RadioGroupDataAttributes } from './RadioGroupDataAttributes'

import type { RadioGroupContextValue } from './RadioGroupContext'
import type { FieldRootState } from '../field/root/FieldRoot'
import type { ModifierKey } from '../internals/composite/composite'
import type {
  BaseUIChangeEventDetails,
  REASONS,
} from '../internals/createChangeEventDetails'
import type { RenderProp } from '../internals/createRender'
import type { JSX } from 'solid-js'

const MODIFIER_KEYS: ReadonlyArray<ModifierKey> = [SHIFT]

/**
 * Provides a shared state to a series of radio buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Radio Group](https://base-ui.com/react/components/radio)
 *
 * @param componentProps - Radio group props.
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Radio } from "@script-augur/base-ui-solid/radio"
 * import { RadioGroup } from "@script-augur/base-ui-solid/radio-group"
 *
 * <RadioGroup defaultValue="a">
 *   <Radio.Root value="a" />
 *   <Radio.Root value="b" />
 * </RadioGroup>
 * ```
 */
export function RadioGroup<TValue = unknown>(
  componentProps: RadioGroupProps<TValue>
): JSX.Element {
  const [local, elementProps] = splitProps(
    componentProps as RadioGroupProps<unknown> & Record<string, unknown>,
    [
      'render',
      'class',
      'style',
      'disabled',
      'readOnly',
      'required',
      'onValueChange',
      'value',
      'defaultValue',
      'form',
      'name',
      'inputRef',
      'id',
      'ref',
      'children',
    ]
  )

  const field = useFieldRootContext()
  const { labelId } = useLabelableContext()
  const { clearErrors, elementRef } = useFormContext()
  const fieldsetContext = useFieldsetRootContext(true)

  const disabled = () => field.disabled() || Boolean(local.disabled)
  const name = () => field.name() ?? local.name
  const generatedId = createUniqueId()
  const fieldControlId = () => local.id ?? generatedId

  const [checkedValue, checkedValueAssign] = createControlled<
    TValue | undefined
  >({
    value: () => local.value as TValue | undefined,
    defaultValue: local.defaultValue as TValue | undefined,
  })

  const [touched, touchedAssign] = createSignal(false)
  const [highlightedIndex, highlightedIndexAssign] = createSignal(0)

  function setCheckedValue(
    next: TValue,
    eventDetails: RadioGroupChangeEventDetails
  ) {
    ;(local.onValueChange as RadioGroupProps<TValue>['onValueChange'])?.(
      next,
      eventDetails
    )
    if (eventDetails.isCanceled) return
    checkedValueAssign(next)
  }

  const controlRef: { current: HTMLElement | null } = {
    get current() {
      return field.validation.getInputControl()
    },
    set current(_element: HTMLElement | null) {
      // Representative control comes from registered inputs.
    },
  }

  const groupInputRef: { current: HTMLInputElement | null } = { current: null }
  const firstEnabledInputRef: { current: HTMLInputElement | null } = {
    current: null,
  }

  function setInputRef(hiddenInput: HTMLInputElement | null) {
    let cleanup: void | (() => void) | undefined

    const propRef = local.inputRef
    if (propRef) {
      if (typeof propRef === 'function') {
        cleanup = propRef(hiddenInput)
      } else {
        propRef.current = hiddenInput
      }
    }

    groupInputRef.current = hiddenInput
    return cleanup
  }

  function registerInputRef(input: HTMLInputElement | null) {
    if (!input || input.disabled) return undefined

    if (!firstEnabledInputRef.current) {
      firstEnabledInputRef.current = input
    }

    const currentInput = groupInputRef.current
    const cleanup =
      input.checked || currentInput == null || currentInput.disabled
        ? setInputRef(input)
        : undefined

    return () => {
      if (firstEnabledInputRef.current === input) {
        firstEnabledInputRef.current = null
      }
      if (groupInputRef.current === input) {
        if (cleanup) {
          cleanup()
          groupInputRef.current = null
        } else {
          void setInputRef(null)
        }
      } else {
        cleanup?.()
      }
    }
  }

  function getFormValue() {
    const formElement = elementRef.current
    if (!formElement) return checkedValue() ?? null

    for (const input of field.validation.registeredInputs.keys()) {
      if (input.checked && isEligibleInput(input, formElement)) {
        return checkedValue() ?? null
      }
    }

    return null
  }

  createRegisterFieldControl({
    controlRef,
    id: fieldControlId,
    value: () => checkedValue() ?? null,
    getFormValueOverride: () => getFormValue,
    enabled: () => !disabled(),
    name: () => local.name,
  })

  createEffectOnValueChange(checkedValue, () => {
    clearErrors(name())
    field.dirtyAssign(checkedValue() !== field.validityData().initialValue)
    field.filledAssign(checkedValue() != null)
    field.validation.change(checkedValue())

    const fallbackInput = firstEnabledInputRef.current
    if (checkedValue() == null && fallbackInput && !fallbackInput.disabled) {
      void setInputRef(fallbackInput)
    }
  })

  const ariaLabelledby = () => labelId() ?? fieldsetContext?.legendId()

  const state: RadioGroupState = {
    get disabled() {
      return disabled()
    },
    get required() {
      return local.required ?? false
    },
    get readOnly() {
      return local.readOnly ?? false
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

  const contextValue: RadioGroupContextValue = {
    checkedValue: checkedValue,
    disabled,
    form: () => local.form,
    validation: field.validation,
    name,
    readOnly: () => local.readOnly,
    registerInputRef,
    required: () => local.required,
    setCheckedValue:
      setCheckedValue as RadioGroupContextValue['setCheckedValue'],
    touched,
    touchedAssign,
  }

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <CompositeRoot<Record<string, never>, RadioGroupState>
        render={local.render}
        class={local.class}
        style={local.style}
        state={state}
        refs={[el => local.ref?.(el as Element)]}
        props={[
          {
            get id() {
              return local.id
            },
            role: 'radiogroup',
            get 'aria-required'() {
              return local.required || undefined
            },
            get 'aria-disabled'() {
              return disabled() || undefined
            },
            get 'aria-readonly'() {
              return local.readOnly || undefined
            },
            get 'aria-labelledby'() {
              return ariaLabelledby()
            },
            onFocus() {
              field.focusedAssign(true)
            },
            onBlur(event: FocusEvent) {
              if (
                !contains(
                  event.currentTarget as Node,
                  event.relatedTarget as Node | null
                )
              ) {
                field.touchedAssign(true)
                field.focusedAssign(false)
                if (field.validationMode() === 'onBlur') {
                  void field.validation.commit(checkedValue())
                }
              }
            },
            onKeyDownCapture(event: KeyboardEvent) {
              if (event.key.startsWith('Arrow')) {
                touchedAssign(true)
                field.focusedAssign(true)
              }
            },
            get [RadioGroupDataAttributes.disabled]() {
              return dataAttr(disabled())
            },
          },
          elementProps,
          {
            get 'aria-describedby'() {
              const external = (elementProps as Record<string, unknown>)[
                'aria-describedby'
              ]
              return field.validation.getValidationProps(
                disabled(),
                external != null ? { 'aria-describedby': external } : {}
              )['aria-describedby']
            },
            get 'aria-invalid'() {
              return field.validation.getValidationProps(disabled())[
                'aria-invalid'
              ]
            },
          },
        ]}
        stateAttributesMapping={fieldValidityMapping}
        enableHomeAndEndKeys={false}
        modifierKeys={MODIFIER_KEYS}
        highlightedIndex={highlightedIndex}
        onHighlightedIndexChange={highlightedIndexAssign}
        onMapChange={map => {
          // Solid may register items before ACTIVE_COMPOSITE_ITEM attrs apply.
          const sync = () => {
            for (const [element, meta] of map) {
              if (
                (element as HTMLElement).hasAttribute(
                  'data-composite-item-active'
                )
              ) {
                highlightedIndexAssign(meta.index)
                return true
              }
            }
            return false
          }
          if (!sync()) {
            queueMicrotask(sync)
          }
        }}
        tag="div"
      >
        {local.children}
      </CompositeRoot>
    </RadioGroupContext.Provider>
  )
}

/**
 * Public state exposed to `render` functions.
 */
export interface RadioGroupState extends FieldRootState {
  /**
   * Whether the user should be unable to select a different radio button in the group.
   */
  readOnly: boolean
  /**
   * Whether the user must tick a radio button within the group before submitting a form.
   */
  required: boolean
}

/**
 * Props for {@link RadioGroup}.
 *
 * @typeParam TValue - Selected radio value type.
 */
export interface RadioGroupProps<TValue = unknown> extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'value' | 'children' | 'color'
> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Whether the user should be unable to select a different radio button in the group.
   * @default false
   */
  readOnly?: boolean | undefined
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined
  /**
   * Identifies the form that owns the radio inputs.
   * Useful when the radio group is rendered outside the form.
   */
  form?: string | undefined
  /**
   * The controlled value of the radio item that should be currently selected.
   *
   * To render an uncontrolled radio group, use the `defaultValue` prop instead.
   */
  value?: TValue | undefined
  /**
   * The uncontrolled value of the radio button that should be initially selected.
   *
   * To render a controlled radio group, use the `value` prop instead.
   */
  defaultValue?: TValue | undefined
  /**
   * Callback fired when the value changes.
   */
  onValueChange?:
    | ((value: TValue, eventDetails: RadioGroupChangeEventDetails) => void)
    | undefined
  /**
   * A ref to access the hidden input element.
   */
  inputRef?:
    | ((element: HTMLInputElement | null) => void)
    | { current: HTMLInputElement | null }
    | undefined
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   */
  render?: RenderProp<RadioGroupState, Record<string, unknown>>
  /**
   * Radio group contents (typically {@link Radio.Root} items).
   */
  children?: JSX.Element
  /**
   * Ref to the group element.
   */
  ref?: ((element: Element) => void) | undefined
}

export type RadioGroupChangeEventReason = typeof REASONS.none
export type RadioGroupChangeEventDetails =
  BaseUIChangeEventDetails<RadioGroupChangeEventReason>

/**
 * Runs `onChange` when `getValue` changes after the initial read
 * (mirrors React `useValueChanged`).
 */
function createEffectOnValueChange<T>(
  getValue: () => T,
  onChange: () => void
): void {
  createEffect((prev: { value: T } | undefined) => {
    const next = getValue()
    if (prev !== undefined && !Object.is(prev.value, next)) {
      onChange()
    }
    return { value: next }
  })
}
