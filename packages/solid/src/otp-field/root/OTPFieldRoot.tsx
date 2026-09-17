import {
  contains,
  ownerDocument,
  visuallyHidden,
  visuallyHiddenInput,
} from '@script-augur/base-ui-utils'
import {
  Show,
  children,
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { CompositeList } from '../../internals/composite/list/CompositeList'
import {
  REASONS,
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'
import { createRegisterFieldControl } from '../../internals/field-register-control/createRegisterFieldControl'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../../internals/form-context/FormContext'
import { createAriaLabelledBy } from '../../internals/labelable-provider/createAriaLabelledBy'
import { createLabelableId } from '../../internals/labelable-provider/createLabelableId'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import {
  getOTPValidationConfig,
  normalizeOTPValue,
  normalizeOTPValueWithDetails,
} from '../utils/otp'
import { rootStateAttributesMapping } from '../utils/stateAttributesMapping'

import { OTPFieldRootContext } from './OTPFieldRootContext'

import type { OTPFieldRootContextValue } from './OTPFieldRootContext'
import type { FieldRootState } from '../../field/root/FieldRoot'
import type {
  BaseUIChangeEventDetails,
  BaseUIGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { OTPValidationType } from '../utils/otp'
import type { JSX } from 'solid-js'

/**
 * Groups all OTP field parts and manages their state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
export function OTPFieldRoot(componentProps: OTPFieldRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'id',
    'aria-describedby',
    'aria-labelledby',
    'autoComplete',
    'defaultValue',
    'value',
    'onValueChange',
    'onValueComplete',
    'form',
    'length',
    'autoSubmit',
    'mask',
    'inputMode',
    'validationType',
    'normalizeValue',
    'disabled',
    'readOnly',
    'required',
    'name',
    'onValueInvalid',
    'render',
    'class',
    'style',
    'ref',
    'children',
  ])

  const field = useFieldRootContext()
  const { clearErrors } = useFormContext()
  const { getDescriptionProps, labelId } = useLabelableContext()

  const disabled = () => field.disabled() || Boolean(local.disabled)
  const name = () => field.name() ?? local.name
  const required = () => local.required ?? false
  const readOnly = () => local.readOnly ?? false
  const autoComplete = () => local.autoComplete ?? 'one-time-code'
  const autoSubmit = () => local.autoSubmit ?? false
  const mask = () => local.mask ?? false
  const validationType = (): OTPValidationType =>
    local.validationType ?? 'numeric'
  const length = () => local.length
  const normalizeValue = () => local.normalizeValue

  const rootRef: { current: HTMLDivElement | null } = { current: null }
  const inputRefs: { current: Array<HTMLInputElement | null> } = {
    current: [],
  }
  const pendingFocusRef: {
    current: { index: number; value: string } | null
  } = { current: null }
  const pendingCompleteValueRef: {
    current: {
      value: string
      eventDetails: OTPFieldRootCompleteEventDetails
    } | null
  } = { current: null }

  const firstInputRef: { current: HTMLInputElement | null } = {
    get current() {
      return inputRefs.current[0] ?? null
    },
    set current(_value: HTMLInputElement | null) {
      // Composite list owns the array; first slot is always index 0.
    },
  }

  const id = createLabelableId({ id: () => local.id })
  const ariaLabelledBy = createAriaLabelledBy({
    explicitAriaLabelledBy: () => local['aria-labelledby'],
    labelId,
    labelSourceRef: firstInputRef,
    enableFallback: true,
    labelSourceId: id,
  })
  const inputAriaLabelledBy = () =>
    local['aria-labelledby'] == null ? ariaLabelledBy() : undefined

  const fieldDescriptionProps = () => getDescriptionProps({})
  const ariaDescribedBy = () =>
    mergeAriaIds(
      local['aria-describedby'],
      fieldDescriptionProps()['aria-describedby'] as string | undefined
    )

  const validationConfig = () => getOTPValidationConfig(validationType())
  const pattern = () => validationConfig()?.slotPattern
  const hiddenInputPattern = () => validationConfig()?.getRootPattern(length())
  const inputMode = () => local.inputMode ?? validationConfig()?.inputMode
  const hasValidLength = () => Number.isInteger(length()) && length() > 0

  const [valueUnwrapped, valueAssign] = createControlled<string>({
    value: () => local.value,
    defaultValue: local.defaultValue ?? '',
  })

  const value = () =>
    normalizeOTPValue(
      valueUnwrapped(),
      length(),
      validationType(),
      normalizeValue()
    )
  const valueRef: { current: string } = { current: '' }
  createEffect(() => {
    valueRef.current = value()
  })

  const filled = () => value() !== ''

  const [inputCount, inputCountAssign] = createSignal(0)
  const [focusedIndex, focusedIndexAssign] = createSignal(
    Math.min((local.defaultValue ?? local.value ?? '').length, length() - 1)
  )
  const [focused, focusedAssign] = createSignal(false)

  const activeIndex = () =>
    focused()
      ? Math.min(focusedIndex(), Math.max(length() - 1, 0))
      : Math.min(value().length, length() - 1)

  createEffect(() => {
    field.filledAssign(filled())
  })

  createEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return
    }
    const count = inputCount()
    const slotLength = length()
    const handle = queueMicrotask(() => {
      // Prefer the latest map size after mount/reconciliation settles.
      const latestCount = inputCount()
      if (
        !Number.isInteger(slotLength) ||
        slotLength <= 0 ||
        latestCount === 0 ||
        latestCount === slotLength
      ) {
        return
      }
      console.warn(
        `<OTPField.Root> \`length\` must match the number of rendered ` +
          `<OTPField.Input /> parts. Received \`length={${slotLength}}\` but rendered ` +
          `${latestCount} input${latestCount === 1 ? '' : 's'}.`
      )
    })
    onCleanup(() => {
      // queueMicrotask cannot be cancelled; count is re-checked above.
      void handle
      void count
    })
  })

  createEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return
    }
    const slotLength = length()
    if (Number.isInteger(slotLength) && slotLength > 0) {
      return
    }
    console.warn(
      `<OTPField.Root> \`length\` must be a positive integer. Received \`length={${String(slotLength)}}\`.`
    )
  })

  createRegisterFieldControl({
    controlRef: firstInputRef,
    id,
    value,
    enabled: () => !disabled(),
    name: () => local.name,
  })

  function focusInput(index: number) {
    const targetIndex = Math.min(
      Math.max(index, 0),
      Math.max(inputRefs.current.length - 1, 0)
    )
    const target = inputRefs.current[targetIndex]
    target?.focus()
    target?.select()
  }

  function queueFocusInput(index: number, nextValue: string) {
    pendingFocusRef.current = { index, value: nextValue }
  }

  function requestSubmit() {
    let formElement =
      field.validation.inputRef.current?.form ??
      inputRefs.current[0]?.form ??
      null

    if (local.form) {
      const associatedElement = ownerDocument(rootRef.current).getElementById(
        local.form
      )
      if (associatedElement?.tagName === 'FORM') {
        formElement = associatedElement as HTMLFormElement
      }
    }

    if (formElement && typeof formElement.requestSubmit === 'function') {
      formElement.requestSubmit()
    }
  }

  function completeValue(
    completedValue: string,
    eventDetails: OTPFieldRootCompleteEventDetails
  ) {
    local.onValueComplete?.(completedValue, eventDetails)

    if (autoSubmit()) {
      requestSubmit()
    }
  }

  createEffectOnValueChange(value, () => {
    clearErrors(name())
    field.dirtyAssign(value() !== field.validityData().initialValue)

    field.validation.change(value())

    // Controlled external updates still need queued focus/complete handling.
    flushPendingValueSideEffects(value())
  })

  function setValue(
    nextValue: string,
    details: OTPFieldRootChangeEventDetails
  ): string | null {
    const normalizedValue = normalizeOTPValue(
      nextValue,
      length(),
      validationType(),
      normalizeValue()
    )
    const canComplete =
      details.reason === REASONS.inputChange ||
      details.reason === REASONS.inputPaste
    const completeEventDetails =
      canComplete &&
      normalizedValue.length === length() &&
      (valueRef.current.length !== length() ||
        details.reason === REASONS.inputPaste)
        ? (createGenericEventDetails(
            details.reason,
            details.event
          ) as OTPFieldRootCompleteEventDetails)
        : null

    if (normalizedValue === valueRef.current) {
      if (completeEventDetails != null) {
        completeValue(normalizedValue, completeEventDetails)
      }

      return null
    }

    local.onValueChange?.(normalizedValue, details)

    if (details.isCanceled) {
      return null
    }

    valueAssign(normalizedValue)

    if (completeEventDetails != null) {
      pendingCompleteValueRef.current = {
        value: normalizedValue,
        eventDetails: completeEventDetails,
      }
    } else if (normalizedValue.length !== length()) {
      pendingCompleteValueRef.current = null
    }

    // Callers queue focus after setValue returns; flush on a microtask so both
    // pending focus and pending complete are visible.
    queueMicrotask(() => {
      flushPendingValueSideEffects(normalizedValue)
    })

    return normalizedValue
  }

  function flushPendingValueSideEffects(committedValue: string) {
    const pendingFocus = pendingFocusRef.current

    if (pendingFocus != null) {
      pendingFocusRef.current = null

      if (pendingFocus.value === committedValue) {
        focusInput(pendingFocus.index)
      }
    }

    const pendingCompleteValue = pendingCompleteValueRef.current

    if (pendingCompleteValue != null) {
      pendingCompleteValueRef.current = null

      if (pendingCompleteValue.value === committedValue) {
        completeValue(committedValue, pendingCompleteValue.eventDetails)
      }
    }
  }

  function reportValueInvalid(
    invalidValue: string,
    details: OTPFieldRootInvalidEventDetails
  ) {
    local.onValueInvalid?.(invalidValue, details)
  }

  function handleInputFocus(
    index: number,
    event: FocusEvent & { currentTarget: HTMLInputElement }
  ) {
    if (index > valueRef.current.length) {
      focusInput(Math.min(valueRef.current.length, length() - 1))
      return
    }

    focusedIndexAssign(index)
    focusedAssign(true)
    field.focusedAssign(true)
    event.currentTarget.select()
  }

  function handleInputBlur(
    event: FocusEvent & { currentTarget: HTMLInputElement }
  ) {
    if (contains(rootRef.current, event.relatedTarget as Node | null)) {
      return
    }

    field.touchedAssign(true)
    focusedAssign(false)
    field.focusedAssign(false)

    if (field.validationMode() === 'onBlur') {
      void field.validation.commit(valueRef.current)
    }
  }

  function getInputId(index: number) {
    const resolvedId = id()
    if (resolvedId == null) {
      return undefined
    }

    return index === 0 ? resolvedId : `${resolvedId}-${index + 1}`
  }

  const state: OTPFieldRootState = {
    get complete() {
      return value().length === length()
    },
    get disabled() {
      return disabled()
    },
    get filled() {
      return filled()
    },
    get focused() {
      return focused()
    },
    get length() {
      return length()
    },
    get readOnly() {
      return readOnly()
    },
    get required() {
      return required()
    },
    get value() {
      return value()
    },
    get valid() {
      return field.state.valid
    },
    get touched() {
      return field.state.touched
    },
    get dirty() {
      return field.state.dirty
    },
  }

  const contextValue: OTPFieldRootContextValue = {
    autoComplete,
    activeIndex,
    disabled,
    form: () => local.form,
    focusInput,
    queueFocusInput,
    getInputId,
    handleInputBlur,
    handleInputFocus,
    inputMode,
    inputAriaLabelledBy,
    invalid: () => field.invalid(),
    length,
    mask,
    pattern,
    reportValueInvalid,
    readOnly,
    required,
    normalizeValue,
    setValue,
    state,
    validationType,
    value,
  }

  function assignRootRef(element: Element | null) {
    rootRef.current = element as HTMLDivElement | null
    const propRef = local.ref
    if (typeof propRef === 'function') {
      propRef(element as HTMLDivElement)
    }
  }

  function assignHiddenInputRef(element: HTMLInputElement | null) {
    field.validation.inputRef.current = element
  }

  createEffect(() => {
    const element = field.validation.inputRef.current
    if (!element || !hasValidLength()) {
      return
    }
    const cleanup = field.validation.registerInput(element, {
      controlRef: firstInputRef,
      value: undefined,
    })
    onCleanup(() => {
      cleanup?.()
    })
  })

  return (
    <CompositeList
      elementsRef={inputRefs}
      onMapChange={newMap => {
        inputCountAssign(newMap.size)
      }}
    >
      <OTPFieldRootContext.Provider value={contextValue}>
        <OTPFieldRootRender
          state={state}
          render={local.render}
          class={local.class}
          style={local.style}
          elementProps={elementProps}
          ref={assignRootRef}
          ariaDescribedBy={ariaDescribedBy}
          ariaLabelledBy={ariaLabelledBy}
        >
          {local.children}
        </OTPFieldRootRender>
        <Show when={hasValidLength()}>
          <input
            ref={assignHiddenInputRef}
            type="text"
            id={id() && name() == null ? `${id()}-hidden-input` : undefined}
            form={local.form}
            name={name()}
            value={value()}
            autocomplete={autoComplete()}
            inputMode={inputMode()}
            minLength={length()}
            maxLength={length()}
            pattern={hiddenInputPattern()}
            disabled={disabled()}
            readOnly={readOnly()}
            required={required()}
            aria-hidden={true}
            tabIndex={-1}
            style={name() ? visuallyHiddenInput : visuallyHidden}
            aria-describedby={
              field.validation.getValidationProps(disabled())[
                'aria-describedby'
              ] as string | undefined
            }
            aria-invalid={
              field.validation.getValidationProps(disabled())[
                'aria-invalid'
              ] as boolean | undefined
            }
            onFocus={() => {
              focusInput(0)
            }}
            onInput={(
              event: InputEvent & { currentTarget: HTMLInputElement }
            ) => {
              if (event.defaultPrevented || disabled() || readOnly()) {
                return
              }

              const rawValue = event.currentTarget.value
              const [normalizedValue, didRejectCharacters] =
                normalizeOTPValueWithDetails(
                  rawValue,
                  length(),
                  validationType(),
                  normalizeValue()
                )

              if (didRejectCharacters) {
                reportValueInvalid(
                  rawValue,
                  createGenericEventDetails(REASONS.inputChange, event)
                )
              }

              const committedValue = setValue(
                normalizedValue,
                createChangeEventDetails(REASONS.inputChange, event)
              )

              if (committedValue != null && committedValue !== '') {
                queueFocusInput(committedValue.length - 1, committedValue)
              }
            }}
          />
        </Show>
      </OTPFieldRootContext.Provider>
    </CompositeList>
  )
}
export interface OTPFieldRootProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'children'
> {
  /**
   * The id of the first input element.
   * Subsequent inputs derive their ids from it (`{id}-2`, `{id}-3`, and so on).
   */
  id?: string | undefined
  /**
   * The input autocomplete attribute. Applied to the first slot and hidden validation input.
   * @default 'one-time-code'
   */
  autoComplete?: string | undefined
  /**
   * A string specifying the `form` element with which the hidden input is associated.
   * This string's value must match the id of a `form` element in the same document.
   */
  form?: string | undefined
  /**
   * The number of OTP input slots.
   * Required so the root can clamp values, detect completion, and generate
   * consistent validation markup before all slots hydrate.
   */
  length: number
  /**
   * Whether to submit the owning form when the OTP becomes complete.
   * @default false
   */
  autoSubmit?: boolean | undefined
  /**
   * Whether the slot inputs should mask entered characters.
   * Pass `type` directly to individual `<OTPField.Input>` parts to use a custom
   * input type.
   * @default false
   */
  mask?: boolean | undefined
  /**
   * The virtual keyboard hint applied to the slot inputs and hidden validation input.
   *
   * Built-in validation modes provide sensible defaults, but you can override them when needed.
   */
  inputMode?: JSX.HTMLAttributes<HTMLInputElement>['inputMode'] | undefined
  /**
   * The type of input validation to apply to the OTP value.
   * @default 'numeric'
   */
  validationType?: OTPValidationType | undefined
  /**
   * Function that normalizes the OTP value after whitespace and `validationType` filtering.
   */
  normalizeValue?: ((value: string) => string) | undefined
  /**
   * Whether the user must enter a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Whether the user should be unable to change the field value.
   * @default false
   */
  readOnly?: boolean | undefined
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined
  /**
   * The OTP value.
   */
  value?: string | undefined
  /**
   * The uncontrolled OTP value when the component is initially rendered.
   */
  defaultValue?: string | undefined
  /**
   * Callback fired when the OTP value changes.
   */
  onValueChange?:
    | ((value: string, eventDetails: OTPFieldRootChangeEventDetails) => void)
    | undefined
  /**
   * Callback fired when entered text contains characters that are rejected by validation or
   * normalization before the OTP value updates.
   */
  onValueInvalid?:
    | ((value: string, eventDetails: OTPFieldRootInvalidEventDetails) => void)
    | undefined
  /**
   * Callback function that is fired when the OTP value becomes complete, or when a complete value
   * is pasted while the OTP is already complete.
   */
  onValueComplete?:
    | ((value: string, eventDetails: OTPFieldRootCompleteEventDetails) => void)
    | undefined
  /** Base UI-style render prop. */
  render?: RenderProp<OTPFieldRootState, Record<string, unknown>>
  /** Ref callback for the root element. */
  ref?: ((element: Element) => void) | undefined
  children?: JSX.Element
}
export interface OTPFieldRootState extends FieldRootState {
  /**
   * Whether all slots are filled.
   */
  complete: boolean
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean
  /**
   * The number of OTP input slots.
   */
  length: number
  /**
   * Whether the user should be unable to change the field value.
   */
  readOnly: boolean
  /**
   * Whether the user must enter a value before submitting a form.
   */
  required: boolean
  /**
   * The OTP value.
   */
  value: string
}
export type OTPFieldRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.inputPaste
  | typeof REASONS.keyboard
export type OTPFieldRootChangeEventDetails =
  BaseUIChangeEventDetails<OTPFieldRootChangeEventReason>
export type OTPFieldRootInvalidEventReason =
  typeof REASONS.inputChange | typeof REASONS.inputPaste
export type OTPFieldRootInvalidEventDetails =
  BaseUIGenericEventDetails<OTPFieldRootInvalidEventReason>
export type OTPFieldRootCompleteEventReason =
  typeof REASONS.inputChange | typeof REASONS.inputPaste
export type OTPFieldRootCompleteEventDetails =
  BaseUIGenericEventDetails<OTPFieldRootCompleteEventReason>
function OTPFieldRootRender(props: {
  state: OTPFieldRootState
  render: OTPFieldRootProps['render']
  class: OTPFieldRootProps['class']
  style: OTPFieldRootProps['style']
  elementProps: Record<string, unknown>
  ref: ((element: Element) => void) | undefined
  ariaDescribedBy: () => string | undefined
  ariaLabelledBy: () => string | undefined
  children?: JSX.Element
}): JSX.Element {
  // Resolve children under the Provider so Input parts can read context.
  const resolvedChildren = children(() => props.children)

  return createRender<OTPFieldRootState, Record<string, unknown>>({
    defaultElement: 'div',
    state: props.state,
    render: props.render,
    stateAttributesMapping: rootStateAttributesMapping,
    ref: props.ref,
    props: mergeProps(props.elementProps, {
      role: 'group',
      get class() {
        return props.class
      },
      get style() {
        return props.style
      },
      get 'aria-describedby'() {
        return props.ariaDescribedBy()
      },
      get 'aria-labelledby'() {
        return props.ariaLabelledBy()
      },
      get children() {
        return resolvedChildren()
      },
    }),
  })
}
function mergeAriaIds(...values: Array<string | undefined>) {
  const ids = values.flatMap(value => value?.split(/\s+/).filter(Boolean) ?? [])
  return ids.length > 0 ? Array.from(new Set(ids)).join(' ') : undefined
}
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
