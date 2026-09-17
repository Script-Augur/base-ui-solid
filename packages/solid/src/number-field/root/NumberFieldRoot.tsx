import {
  activeElement,
  addEventListener,
  formatNumber,
  ownerDocument,
  platform,
  visuallyHidden,
  visuallyHiddenInput,
} from '@script-augur/base-ui-utils'
import {
  children,
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../../internals/form-context/FormContext'
import { createLabelableId } from '../../internals/labelable-provider/createLabelableId'
import { dataAttr } from '../../internals/useRender'
import {
  BASE_NON_NUMERIC_SYMBOLS,
  MINUS_SIGNS_WITH_ASCII,
  PERCENTAGES,
  PERMILLE,
  PLUS_SIGNS_WITH_ASCII,
  SPACE_SEPARATOR_RE,
  getFormatParts,
  getNumberLocaleDetails,
} from '../utils/parse'
import { stateAttributesMapping } from '../utils/stateAttributesMapping'
import { toValidatedNumber } from '../utils/validate'

import { NumberFieldRootContext } from './NumberFieldRootContext'

import type {
  InputMode,
  NumberFieldRootContextValue,
} from './NumberFieldRootContext'
import type { FieldRootState } from '../../field/root/FieldRoot'
import type {
  BaseUIChangeEventDetails,
  BaseUIGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type {
  ChangeEventCustomProperties,
  EventWithOptionalKeyState,
  IncrementValueParameters,
} from '../utils/types'
import type { JSX } from 'solid-js'
/**
 * Groups all parts of the number field and manages its state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldRoot(
  componentProps: NumberFieldRootProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'id',
    'min',
    'max',
    'smallStep',
    'step',
    'largeStep',
    'required',
    'disabled',
    'readOnly',
    'form',
    'name',
    'defaultValue',
    'value',
    'onValueChange',
    'onValueCommitted',
    'allowWheelScrub',
    'snapOnStep',
    'allowOutOfRange',
    'format',
    'locale',
    'render',
    'class',
    'style',
    'inputRef',
    'ref',
    'children',
  ])

  const field = useFieldRootContext()
  const { clearErrors } = useFormContext()

  const disabled = () => field.disabled() || Boolean(local.disabled)
  const name = () => field.name() ?? local.name
  const required = () => local.required ?? false
  const readOnly = () => local.readOnly ?? false
  const smallStep = () => local.smallStep ?? 0.1
  const stepProp = () => local.step ?? 1
  const largeStep = () => local.largeStep ?? 10
  const step = (): number => {
    const resolved = stepProp()
    return resolved === 'any' ? 1 : resolved
  }
  const allowWheelScrub = () => local.allowWheelScrub ?? false
  const snapOnStep = () => local.snapOnStep ?? false
  const allowOutOfRange = () => local.allowOutOfRange ?? false
  const locale = () => local.locale
  const format = () => local.format

  const [isScrubbing, isScrubbingAssign] = createSignal(false)

  const minWithDefault = () => local.min ?? Number.MIN_SAFE_INTEGER
  const maxWithDefault = () => local.max ?? Number.MAX_SAFE_INTEGER
  const minWithZeroDefault = () => local.min ?? 0
  const formatStyle = () => format()?.style

  const inputRef: { current: HTMLInputElement | null } = { current: null }
  const [inputElement, inputElementAssign] =
    createSignal<HTMLInputElement | null>(null)
  const hiddenInputRef: { current: HTMLInputElement | null } = { current: null }

  const id = createLabelableId({ id: () => local.id })

  const [valueUnwrapped, valueAssign] = createControlled<number | null>({
    value: () => local.value,
    defaultValue: local.defaultValue ?? null,
  })

  const value = (): number | null => valueUnwrapped() ?? null
  const valueRef: { current: number | null } = { current: null }
  createEffect(() => {
    valueRef.current = value()
  })

  createEffect(() => {
    field.filledAssign(value() !== null)
  })

  const formatOptionsRef: {
    current: Intl.NumberFormatOptions | undefined
  } = { current: undefined }
  createEffect(() => {
    formatOptionsRef.current = format()
  })

  const hasPendingCommitRef = { current: false }
  const allowInputSyncRef = { current: true }
  const lastChangedValueRef: { current: number | null } = { current: null }

  const [inputValue, inputValueAssign] = createSignal(
    formatNumber(value(), locale(), format())
  )
  const [inputMode, inputModeAssign] = createSignal<InputMode>('numeric')

  function onValueCommitted(
    nextValue: number | null,
    eventDetails: NumberFieldRootCommitEventDetails
  ) {
    hasPendingCommitRef.current = false
    local.onValueCommitted?.(nextValue, eventDetails)
  }

  function getAllowedNonNumericKeys() {
    const parts = getFormatParts(locale(), format())

    const keys = new Set<string>(BASE_NON_NUMERIC_SYMBOLS)
    const addAll = (chars: ReadonlyArray<string>) =>
      chars.forEach(char => keys.add(char))

    const decimal =
      parts.find(part => part.type === 'decimal')?.value ??
      getNumberLocaleDetails(locale(), format()).decimal
    keys.add(decimal)

    parts.forEach(part => {
      if (
        part.type === 'integer' ||
        part.type === 'fraction' ||
        part.type === 'exponentInteger' ||
        part.type === 'compact'
      ) {
        return
      }
      addAll(Array.from(part.value))
      if (SPACE_SEPARATOR_RE.test(part.value)) {
        keys.add(' ')
      }
    })

    const allowPercentSymbols =
      formatStyle() === 'percent' ||
      (formatStyle() === 'unit' && format()?.unit === 'percent')
    const allowPermilleSymbols =
      formatStyle() === 'percent' ||
      (formatStyle() === 'unit' && format()?.unit === 'permille')

    if (allowPercentSymbols) {
      addAll(PERCENTAGES)
    }
    if (allowPermilleSymbols) {
      addAll(PERMILLE)
    }

    addAll(PLUS_SIGNS_WITH_ASCII)
    if (minWithDefault() < 0 || allowOutOfRange()) {
      addAll(MINUS_SIGNS_WITH_ASCII)
    }

    return keys
  }

  function getStepAmount(event?: EventWithOptionalKeyState) {
    if (event?.altKey) {
      return smallStep()
    }
    if (event?.shiftKey) {
      return largeStep()
    }
    return step()
  }

  function setValue(
    unvalidatedValue: number | null,
    details: NumberFieldRootChangeEventDetails
  ): boolean {
    const eventWithOptionalKeyState = details.event as
      EventWithOptionalKeyState | undefined
    const dir = details.direction

    const isInputReason =
      details.reason.startsWith('input-') || details.reason === REASONS.none

    const shouldClampValue = !allowOutOfRange() || !isInputReason

    const validatedValue = toValidatedNumber(
      unvalidatedValue,
      dir ? getStepAmount(eventWithOptionalKeyState) * dir : undefined,
      minWithDefault(),
      maxWithDefault(),
      minWithZeroDefault(),
      formatOptionsRef.current,
      snapOnStep(),
      eventWithOptionalKeyState?.altKey ?? false,
      shouldClampValue
    )

    const shouldFireChange =
      validatedValue !== value() ||
      (isInputReason &&
        (unvalidatedValue !== value() || allowInputSyncRef.current === false))

    if (shouldFireChange) {
      local.onValueChange?.(validatedValue, details)

      if (details.isCanceled) {
        return false
      }

      valueAssign(validatedValue)
      valueRef.current = validatedValue
      field.dirtyAssign(validatedValue !== field.validityData().initialValue)
      hasPendingCommitRef.current = true
      // Clear Form errors and revalidate here rather than only in Input's
      // createEffect(prev): Solid may remount Input when Root state attrs
      // update, resetting that effect's `prev` and skipping clearErrors.
      clearErrors(name())
      field.validation.change(validatedValue)
    }

    lastChangedValueRef.current = validatedValue

    if (allowInputSyncRef.current) {
      const formatted = formatNumber(validatedValue, locale(), format())
      inputValueAssign(formatted)
      // Solid may not push `value` getter updates to the IDL property without a
      // parent re-render; keep the visible input in sync explicitly.
      if (inputRef.current && inputRef.current.value !== formatted) {
        inputRef.current.value = formatted
      }
    }

    return shouldFireChange
  }

  function incrementValue(
    amount: number,
    { direction, currentValue, event, reason }: IncrementValueParameters
  ): boolean {
    const prevValue = currentValue == null ? valueRef.current : currentValue

    if (typeof prevValue !== 'number') {
      return setValue(0, createChangeEventDetails(reason, event))
    }

    return setValue(
      prevValue + amount * direction,
      createChangeEventDetails(reason, event, undefined, {
        direction,
      })
    )
  }

  createEffect(function syncFormattedInputValueOnValueChange() {
    if (!allowInputSyncRef.current) return

    const nextInputValue = formatNumber(value(), locale(), format())

    if (nextInputValue !== inputValue()) {
      inputValueAssign(nextInputValue)
    }
  })

  createEffect(function setDynamicInputModeForIOS() {
    if (!platform.os.ios) return

    let computedInputMode: InputMode = 'text'

    if (minWithDefault() >= 0) {
      computedInputMode = 'decimal'
    }

    inputModeAssign(computedInputMode)
  })

  createEffect(function registerElementWheelListener() {
    const element = inputElement()
    if (disabled() || readOnly() || !allowWheelScrub() || !element) {
      return undefined
    }

    function handleWheel(event: WheelEvent) {
      if (
        event.ctrlKey ||
        activeElement(ownerDocument(inputRef.current)) !== inputRef.current
      ) {
        return
      }

      event.preventDefault()
      allowInputSyncRef.current = true

      const amount = getStepAmount(event)

      const changed = incrementValue(amount, {
        direction: event.deltaY > 0 ? -1 : 1,
        event,
        reason: REASONS.wheel,
      })
      if (changed) {
        onValueCommitted(
          lastChangedValueRef.current,
          createGenericEventDetails(REASONS.wheel, event)
        )
      }
    }

    const unsubscribe = addEventListener(element, 'wheel', handleWheel, {
      passive: false,
    })
    onCleanup(unsubscribe)
  })

  const state: NumberFieldRootState = {
    get disabled() {
      return disabled()
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
    get inputValue() {
      return inputValue()
    },
    get scrubbing() {
      return isScrubbing()
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

  function assignInputRef(element: HTMLInputElement | null) {
    inputRef.current = element
    inputElementAssign(element)
  }

  const contextValue: NumberFieldRootContextValue = {
    inputRef,
    assignInputRef,
    minWithDefault,
    maxWithDefault,
    id,
    setValue,
    incrementValue,
    getStepAmount,
    allowInputSyncRef,
    formatOptionsRef,
    valueRef,
    lastChangedValueRef,
    hasPendingCommitRef,
    name,
    nameProp: () => local.name,
    inputMode,
    getAllowedNonNumericKeys,
    min: () => local.min,
    max: () => local.max,
    inputValueAssign,
    locale,
    isScrubbingAssign,
    state,
    onValueCommitted,
  }

  function assignHiddenInputRef(element: HTMLInputElement | null) {
    hiddenInputRef.current = element
    field.validation.inputRef.current = element
    const propRef = local.inputRef
    if (typeof propRef === 'function') {
      propRef(element)
    } else if (propRef && typeof propRef === 'object') {
      propRef.current = element
    }
  }

  createEffect(() => {
    const element = hiddenInputRef.current
    if (!element) {
      return
    }
    const cleanup = field.validation.registerInput(element, {
      controlRef: inputRef,
      value: undefined,
    })
    onCleanup(() => {
      cleanup?.()
    })
  })

  return (
    <NumberFieldRootContext.Provider value={contextValue}>
      <NumberFieldRootRender
        state={state}
        render={local.render}
        class={local.class}
        style={local.style}
        elementProps={elementProps}
        ref={local.ref}
      >
        {local.children}
      </NumberFieldRootRender>
      <input
        ref={assignHiddenInputRef}
        type="number"
        form={local.form}
        name={name()}
        value={value() ?? ''}
        min={local.min}
        max={local.max}
        step={stepProp()}
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
          field.validation.getValidationProps(disabled())['aria-invalid'] as
            boolean | undefined
        }
        onFocus={() => {
          inputRef.current?.focus()
        }}
        onChange={(event: Event & { currentTarget: HTMLInputElement }) => {
          if (event.defaultPrevented || disabled() || readOnly()) {
            return
          }

          const nextValue = event.currentTarget.valueAsNumber
          const parsedValue = Number.isNaN(nextValue) ? null : nextValue
          const details = createChangeEventDetails(REASONS.none, event)

          setValue(parsedValue, details)
          clearErrors(name())
          field.validation.change(lastChangedValueRef.current ?? parsedValue)
        }}
      />
    </NumberFieldRootContext.Provider>
  )
}
export interface NumberFieldRootProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'children'
> {
  /**
   * The id of the input element.
   */
  id?: string | undefined
  /**
   * The minimum value of the input element.
   */
  min?: number | undefined
  /**
   * The maximum value of the input element.
   */
  max?: number | undefined
  /**
   * When true, direct text entry may be outside the `min`/`max` range without clamping,
   * so native range underflow/overflow validation can occur.
   * Step-based interactions (keyboard arrows, buttons, wheel, scrub) still clamp.
   * @default false
   */
  allowOutOfRange?: boolean | undefined
  /**
   * The small step value of the input element when incrementing while the alt key is held.
   * Snaps to multiples of this value when `snapOnStep` is enabled.
   * @default 0.1
   */
  smallStep?: number | undefined
  /**
   * Amount to increment and decrement with the buttons and arrow keys, or to scrub with pointer movement in the scrub area.
   * To always enable step validation on form submission, specify the `min` prop explicitly in conjunction with this prop.
   * Specify `step="any"` to always disable step validation; interactive stepping then uses a base amount of `1`, while the alt and shift keys still step by `smallStep` and `largeStep`.
   * @default 1
   */
  step?: number | 'any' | undefined
  /**
   * The large step value of the input element when incrementing while the shift key is held.
   * Snaps to multiples of this value when `snapOnStep` is enabled.
   * @default 10
   */
  largeStep?: number | undefined
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
   * Identifies the form that owns the hidden input.
   * Useful when the number field is rendered outside the form.
   */
  form?: string | undefined
  /**
   * The raw numeric value of the field.
   */
  value?: number | null | undefined
  /**
   * The uncontrolled value of the field when it's initially rendered.
   *
   * To render a controlled number field, use the `value` prop instead.
   */
  defaultValue?: number | undefined
  /**
   * Whether to allow the user to scrub the input value with the mouse wheel while focused and
   * hovering over the input.
   * @default false
   */
  allowWheelScrub?: boolean | undefined
  /**
   * Whether the value should snap to the nearest step when incrementing or decrementing.
   * @default false
   */
  snapOnStep?: boolean | undefined
  /**
   * Options to format the input value.
   */
  format?: Intl.NumberFormatOptions | undefined
  /**
   * Callback fired when the number value changes.
   */
  onValueChange?:
    | ((
        value: number | null,
        eventDetails: NumberFieldRootChangeEventDetails
      ) => void)
    | undefined
  /**
   * Callback function that is fired when the value is committed.
   */
  onValueCommitted?:
    | ((
        value: number | null,
        eventDetails: NumberFieldRootCommitEventDetails
      ) => void)
    | undefined
  /**
   * The locale of the input element.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined
  /**
   * A ref to access the hidden input element.
   */
  inputRef?:
    | ((element: HTMLInputElement | null) => void)
    | { current: HTMLInputElement | null }
    | undefined
  render?: RenderProp<NumberFieldRootState, Record<string, unknown>>
  children?: JSX.Element
  ref?: ((element: Element) => void) | undefined
}
export interface NumberFieldRootState extends FieldRootState {
  /**
   * The raw numeric value of the field.
   */
  value: number | null
  /**
   * The formatted string value presented in the input element.
   */
  inputValue: string
  /**
   * Whether the user must enter a value before submitting a form.
   */
  required: boolean
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean
  /**
   * Whether the user should be unable to change the field value.
   */
  readOnly: boolean
  /**
   * Whether the user is currently scrubbing the field.
   */
  scrubbing: boolean
}
export type NumberFieldRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.inputBlur
  | typeof REASONS.inputPaste
  | typeof REASONS.keyboard
  | typeof REASONS.incrementPress
  | typeof REASONS.decrementPress
  | typeof REASONS.wheel
  | typeof REASONS.scrub
  | typeof REASONS.none
export type NumberFieldRootChangeEventDetails =
  BaseUIChangeEventDetails<NumberFieldRootChangeEventReason> &
    ChangeEventCustomProperties
export type NumberFieldRootCommitEventReason =
  | typeof REASONS.inputBlur
  | typeof REASONS.inputClear
  | typeof REASONS.keyboard
  | typeof REASONS.incrementPress
  | typeof REASONS.decrementPress
  | typeof REASONS.wheel
  | typeof REASONS.scrub
  | typeof REASONS.none
export type NumberFieldRootCommitEventDetails =
  BaseUIGenericEventDetails<NumberFieldRootCommitEventReason>
/**
 * Renders the Number Field root host under context so memoized children still
 * see the provider, while `children()` prevents `data-*` attribute updates from
 * remounting steppers mid press-and-hold.
 */
function NumberFieldRootRender(props: {
  state: NumberFieldRootState
  render: NumberFieldRootProps['render']
  class: NumberFieldRootProps['class']
  style: NumberFieldRootProps['style']
  elementProps: Record<string, unknown>
  ref: NumberFieldRootProps['ref']
  children?: JSX.Element
}): JSX.Element {
  const resolvedChildren = children(() => props.children)

  return createRender<NumberFieldRootState, Record<string, unknown>>({
    defaultElement: 'div',
    state: props.state,
    render: props.render,
    stateAttributesMapping,
    ref: props.ref,
    props: mergeProps(props.elementProps, {
      get class() {
        return props.class
      },
      get style() {
        return props.style
      },
      get 'data-disabled'() {
        return dataAttr(props.state.disabled)
      },
      get 'data-readonly'() {
        return dataAttr(props.state.readOnly)
      },
      get 'data-required'() {
        return dataAttr(props.state.required)
      },
      get children() {
        return resolvedChildren()
      },
    }),
  })
}
