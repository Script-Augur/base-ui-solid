import { createEffect, mergeProps, splitProps } from 'solid-js'

import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem'
import {
  REASONS,
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useDirection } from '../../internals/direction'
import {
  getOTPFieldInputState,
  useOTPFieldRootContext,
} from '../root/OTPFieldRootContext'
import {
  normalizeOTPValueWithDetails,
  removeOTPCharacter,
  replaceOTPValue,
} from '../utils/otp'
import { inputStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { OTPFieldRootState } from '../root/OTPFieldRoot'
import type { JSX } from 'solid-js'

/**
 * An individual OTP character input.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
export function OTPFieldInput(componentProps: OTPFieldInputProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'aria-label',
    'aria-labelledby',
    'render',
    'class',
    'style',
    'ref',
  ])

  const {
    activeIndex,
    autoComplete,
    disabled,
    form,
    focusInput,
    queueFocusInput,
    getInputId,
    handleInputBlur,
    handleInputFocus,
    inputMode,
    inputAriaLabelledBy,
    invalid,
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
  } = useOTPFieldRootContext()

  const { refAssign, index } = useCompositeListItem()
  let inputElement: HTMLInputElement | null = null
  const direction = useDirection()

  const slotValue = () => value()[index()] ?? ''
  const inputState = getOTPFieldInputState(state, slotValue, index)
  const slotAriaLabel = () => local['aria-label']
  const inheritedLabel = () => local['aria-labelledby'] ?? inputAriaLabelledBy()
  const ariaLabel = () => (index() === 0 ? undefined : slotAriaLabel())

  createEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return
    }
    if (
      index() !== 0 ||
      slotAriaLabel() == null ||
      inputElement?.labels?.length
    ) {
      return
    }

    console.warn(
      '<OTPField.Input> ignores `aria-label` on the first input. Use a `<label>` or `<Field.Label>` to label the OTP field.'
    )
  })

  function assignRef(element: Element | null) {
    inputElement = element as HTMLInputElement | null
    refAssign(element as HTMLElement | null)
    const propRef = local.ref
    if (typeof propRef === 'function') {
      propRef(element as HTMLInputElement)
    }
  }

  function stopEvent(event: Event) {
    event.preventDefault()
    event.stopPropagation()
  }

  return createRender<OTPFieldInputState, Record<string, unknown>>({
    defaultElement: 'input',
    state: inputState,
    render: local.render,
    stateAttributesMapping: inputStateAttributesMapping,
    ref: assignRef,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return getInputId(index())
      },
      get value() {
        return slotValue()
      },
      get type() {
        return mask() ? 'password' : 'text'
      },
      get inputMode() {
        return inputMode()
      },
      get autocomplete() {
        return index() === 0 ? autoComplete() : 'off'
      },
      autocorrect: 'off',
      spellcheck: false,
      get enterkeyhint() {
        return index() === length() - 1 ? 'done' : 'next'
      },
      // Only the first slot has a max length to avoid password manager bubbles.
      get maxlength() {
        return index() === 0 ? length() : undefined
      },
      get tabIndex() {
        return activeIndex() === index() ? 0 : -1
      },
      get disabled() {
        return disabled()
      },
      get form() {
        return form()
      },
      get pattern() {
        return pattern()
      },
      get readOnly() {
        return readOnly()
      },
      get required() {
        return required()
      },
      get 'aria-labelledby'() {
        return ariaLabel() == null ? inheritedLabel() : undefined
      },
      get 'aria-invalid'() {
        return !disabled() && invalid() ? true : undefined
      },
      get 'aria-label'() {
        return ariaLabel()
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      onMouseDown(event: MouseEvent & { currentTarget: HTMLInputElement }) {
        if (event.defaultPrevented || disabled()) {
          return
        }

        event.preventDefault()
        focusInput(index())
      },
      onFocus(event: FocusEvent & { currentTarget: HTMLInputElement }) {
        if (event.defaultPrevented || disabled()) {
          return
        }

        handleInputFocus(index(), event)
      },
      onBlur(event: FocusEvent & { currentTarget: HTMLInputElement }) {
        if (event.defaultPrevented) {
          return
        }

        handleInputBlur(event)
      },
      // Solid: use onInput (≈ React onChange) — native change also fires on blur.
      onInput(event: InputEvent & { currentTarget: HTMLInputElement }) {
        if (event.defaultPrevented || disabled() || readOnly()) {
          return
        }

        const rawValue = event.currentTarget.value
        const [nextDigits, didRejectCharacters] = normalizeOTPValueWithDetails(
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

        if (nextDigits === '') {
          if (rawValue === '') {
            setValue(
              removeOTPCharacter(value(), index()),
              createChangeEventDetails(REASONS.inputClear, event)
            )
          } else if (slotValue() !== '') {
            event.currentTarget.value = slotValue()
            event.currentTarget.select()
          }
          return
        }

        const nextValue = replaceOTPValue(
          value(),
          index(),
          nextDigits,
          length(),
          validationType(),
          normalizeValue()
        )

        const committedValue = setValue(
          nextValue,
          createChangeEventDetails(REASONS.inputChange, event)
        )

        if (committedValue == null) {
          event.currentTarget.value = slotValue()
          return
        }

        const nextInput = Math.min(index() + nextDigits.length, length() - 1)
        queueFocusInput(nextInput, committedValue)
      },
      onKeyDown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
        if (event.defaultPrevented || disabled()) {
          return
        }

        const firstIndex = 0
        const lastIndex = Math.max(length() - 1, firstIndex)
        const endTargetIndex = Math.min(value().length, lastIndex)
        const hasBoundaryModifier =
          (event.ctrlKey || event.metaKey) && !event.altKey
        const isRtl = direction() === 'rtl'
        const previousKey = isRtl ? 'ArrowRight' : 'ArrowLeft'
        const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
        const currentIndex = index()

        if (event.key === previousKey) {
          stopEvent(event)
          focusInput(
            hasBoundaryModifier
              ? firstIndex
              : Math.max(firstIndex, currentIndex - 1)
          )
          return
        }

        if (event.key === nextKey) {
          stopEvent(event)
          focusInput(
            hasBoundaryModifier
              ? endTargetIndex
              : Math.min(lastIndex, currentIndex + 1)
          )
          return
        }

        if (event.key === 'Home' || event.key === 'ArrowUp') {
          stopEvent(event)
          focusInput(firstIndex)
          return
        }

        if (event.key === 'End' || event.key === 'ArrowDown') {
          stopEvent(event)
          focusInput(endTargetIndex)
          return
        }

        if (readOnly()) {
          return
        }

        function setKeyboardValue(nextValue: string, targetIndex: number) {
          const committedValue = setValue(
            nextValue,
            createChangeEventDetails(REASONS.keyboard, event)
          )

          if (committedValue != null) {
            queueFocusInput(targetIndex, committedValue)
          }
        }

        if (event.key === 'Backspace' && hasBoundaryModifier) {
          stopEvent(event)
          setKeyboardValue('', firstIndex)
          return
        }

        if (event.key === 'Delete') {
          stopEvent(event)
          setKeyboardValue(
            removeOTPCharacter(value(), currentIndex),
            currentIndex
          )
          return
        }

        const inputValue = event.currentTarget.value
        const fullSelection =
          event.currentTarget.selectionStart === 0 &&
          event.currentTarget.selectionEnd === inputValue.length

        if (
          event.key.length === 1 &&
          fullSelection &&
          slotValue() === event.key
        ) {
          stopEvent(event)
          if (currentIndex < length() - 1) {
            focusInput(currentIndex + 1)
          }
          return
        }

        if (event.key === 'Backspace') {
          stopEvent(event)
          const targetIndex = Math.max(firstIndex, currentIndex - 1)
          const deleteIndex = slotValue() === '' ? targetIndex : currentIndex
          setKeyboardValue(
            removeOTPCharacter(value(), deleteIndex),
            targetIndex
          )
        }
      },
      onPaste(event: ClipboardEvent & { currentTarget: HTMLInputElement }) {
        if (event.defaultPrevented || disabled() || readOnly()) {
          return
        }

        let rawValue = ''

        try {
          rawValue = event.clipboardData?.getData('text/plain') ?? ''
        } catch {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '<OTPField.Input> could not read clipboard text during paste handling.'
            )
          }

          return
        }

        event.preventDefault()

        const [nextDigits, didRejectCharacters] = normalizeOTPValueWithDetails(
          rawValue,
          length(),
          validationType(),
          normalizeValue()
        )

        if (didRejectCharacters) {
          reportValueInvalid(
            rawValue,
            createGenericEventDetails(REASONS.inputPaste, event)
          )
        }

        if (nextDigits === '') {
          return
        }

        const committedValue = setValue(
          replaceOTPValue(
            value(),
            index(),
            nextDigits,
            length(),
            validationType(),
            normalizeValue()
          ),
          createChangeEventDetails(REASONS.inputPaste, event)
        )

        if (committedValue != null) {
          const nextInput = Math.min(index() + nextDigits.length, length() - 1)
          queueFocusInput(nextInput, committedValue)
        }
      },
    }),
  })
}
export interface OTPFieldInputState extends Omit<
  OTPFieldRootState,
  'filled' | 'value'
> {
  /**
   * Whether this input contains a character.
   */
  filled: boolean
  /**
   * The input index.
   */
  index: number
  /**
   * The character rendered in this slot.
   */
  value: string
}
export interface OTPFieldInputProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'type'
> {
  /** Base UI-style render prop. */
  render?: RenderProp<OTPFieldInputState, Record<string, unknown>>
  /** Ref callback for the input element. */
  ref?: ((element: Element) => void) | undefined
}
