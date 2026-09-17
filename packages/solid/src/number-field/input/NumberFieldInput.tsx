import { formatNumber } from '@script-augur/base-ui-utils'
import { createEffect, mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { createRegisterFieldControl } from '../../internals/field-register-control/createRegisterFieldControl'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../../internals/form-context/FormContext'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext'
import {
  ANY_MINUS_DETECT_RE,
  ANY_MINUS_RE,
  ANY_PLUS_DETECT_RE,
  ANY_PLUS_RE,
  FORMAT_CONTROL_DETECT_RE,
  getNumberLocaleDetails,
  isNumeralChar,
  parseNumber,
} from '../utils/parse'
import { stateAttributesMapping } from '../utils/stateAttributesMapping'
import {
  hasNumberFormatRoundingOptions,
  removeFloatingPointErrors,
} from '../utils/validate'

import type { RenderProp } from '../../internals/createRender'
import type { NumberFieldRootState } from '../root/NumberFieldRoot'
import type { JSX } from 'solid-js'

const NAVIGATE_KEYS = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'Tab',
  'Enter',
  'Escape',
])

/**
 * The native input control in the number field.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldInput(
  componentProps: NumberFieldInputProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
    'aria-roledescription',
  ])

  const root = useNumberFieldRootContext()
  const {
    allowInputSyncRef,
    formatOptionsRef,
    getAllowedNonNumericKeys,
    getStepAmount,
    id,
    incrementValue,
    inputMode,
    max,
    min,
    name,
    nameProp,
    setValue,
    state,
    inputValueAssign,
    locale,
    inputRef,
    assignInputRef,
    onValueCommitted,
    lastChangedValueRef,
    hasPendingCommitRef,
    valueRef,
  } = root

  const { clearErrors } = useFormContext()
  const field = useFieldRootContext()
  const { labelId } = useLabelableContext()

  const hasTouchedInputRef = { current: false }
  const blockRevalidationRef = { current: false }
  const pendingCaretRef: { current: number | null } = { current: null }

  createRegisterFieldControl({
    controlRef: inputRef,
    id,
    value: () => state.value,
    enabled: () => !state.disabled,
    name: nameProp,
  })

  createEffect(() => {
    // Track inputValue so caret restore runs after paste updates.
    void state.inputValue
    if (pendingCaretRef.current == null) return
    const caret = pendingCaretRef.current
    pendingCaretRef.current = null
    inputRef.current?.setSelectionRange(caret, caret)
  })

  createEffect((prev: number | null | undefined) => {
    const next = state.value
    if (prev !== undefined && prev !== next) {
      clearErrors(name())

      if (blockRevalidationRef.current && !field.shouldValidateOnChange()) {
        blockRevalidationRef.current = false
        return next
      }

      field.validation.change(next)
    }
    return next
  })

  return createRender<NumberFieldInputState, Record<string, unknown>>({
    defaultElement: 'input',
    state,
    render: local.render,
    stateAttributesMapping,
    ref: [
      local.ref,
      (el: Element | null | undefined) => {
        assignInputRef((el as HTMLInputElement | null) ?? null)
      },
    ],
    props: mergeProps(
      {
        get id() {
          return id()
        },
        get required() {
          return state.required
        },
        get disabled() {
          return state.disabled
        },
        get readOnly() {
          return state.readOnly
        },
        get inputMode() {
          return inputMode()
        },
        get value() {
          return state.inputValue
        },
        type: 'text',
        autocomplete: 'off',
        autocorrect: 'off',
        spellcheck: false,
        get 'aria-roledescription'() {
          return local['aria-roledescription'] ?? 'Number field'
        },
        get 'aria-labelledby'() {
          return labelId()
        },
        onFocus(event: FocusEvent & { currentTarget: HTMLInputElement }) {
          if (event.defaultPrevented || state.disabled) {
            return
          }

          field.focusedAssign(true)

          if (hasTouchedInputRef.current) {
            return
          }

          hasTouchedInputRef.current = true

          const target = event.currentTarget
          const length = target.value.length
          target.setSelectionRange(length, length)
        },
        onBlur(event: FocusEvent & { currentTarget: HTMLInputElement }) {
          if (event.defaultPrevented || state.disabled) {
            return
          }

          field.touchedAssign(true)
          field.focusedAssign(false)

          if (state.readOnly) {
            return
          }

          const hadManualInput = !allowInputSyncRef.current
          const hadPendingProgrammaticChange = hasPendingCommitRef.current

          allowInputSyncRef.current = true

          if (state.inputValue.trim() === '') {
            const clearDetails = createChangeEventDetails(
              REASONS.inputClear,
              event
            )
            setValue(null, clearDetails)
            if (clearDetails.isCanceled) return
            if (field.validationMode() === 'onBlur') {
              void field.validation.commit(null)
            }
            if (
              hadManualInput ||
              hadPendingProgrammaticChange ||
              state.value !== null
            ) {
              onValueCommitted(
                null,
                createGenericEventDetails(REASONS.inputClear, event)
              )
            }
            return
          }

          const formatOptions = formatOptionsRef.current
          const parsedValue = parseNumber(
            state.inputValue,
            locale(),
            formatOptions
          )
          if (parsedValue === null) return

          const hasRoundingOptions =
            hasNumberFormatRoundingOptions(formatOptions)

          let committed: number | null
          if (!hadManualInput && !hasRoundingOptions) {
            committed = state.value
          } else if (hasRoundingOptions) {
            committed = removeFloatingPointErrors(parsedValue, formatOptions)
          } else {
            committed = parsedValue
          }

          const nextEventDetails = createGenericEventDetails(
            REASONS.inputBlur,
            event
          )
          const shouldUpdateValue = state.value !== committed
          const shouldCommit =
            hadManualInput || shouldUpdateValue || hadPendingProgrammaticChange

          let committedValue = committed
          if (shouldUpdateValue) {
            const changeDetails = createChangeEventDetails(
              REASONS.inputBlur,
              event
            )
            blockRevalidationRef.current = true
            setValue(committed, changeDetails)
            if (changeDetails.isCanceled) {
              blockRevalidationRef.current = false
              return
            }
            committedValue = lastChangedValueRef.current
            if (committedValue === state.value) {
              blockRevalidationRef.current = false
            }
          }
          if (field.validationMode() === 'onBlur') {
            void field.validation.commit(committedValue)
          }
          if (shouldCommit) {
            onValueCommitted(committedValue, nextEventDetails)
          }

          const canonicalText = formatNumber(
            committedValue,
            locale(),
            formatOptions
          )
          if (state.inputValue !== canonicalText) {
            inputValueAssign(canonicalText)
            if (inputRef.current && inputRef.current.value !== canonicalText) {
              inputRef.current.value = canonicalText
            }
          }
        },
        // Solid: use onInput (≈ React onChange) — native change also fires on blur.
        onInput(event: InputEvent & { currentTarget: HTMLInputElement }) {
          if (event.defaultPrevented) return

          allowInputSyncRef.current = false
          const targetValue = event.currentTarget.value

          if (targetValue.trim() === '') {
            inputValueAssign(targetValue)
            setValue(null, createChangeEventDetails(REASONS.inputClear, event))
            return
          }

          const allowedNonNumericKeys = getAllowedNonNumericKeys()
          const isValidCharacterString = Array.from(targetValue).every(
            ch =>
              isNumeralChar(ch) ||
              ANY_MINUS_DETECT_RE.test(ch) ||
              allowedNonNumericKeys.has(ch) ||
              FORMAT_CONTROL_DETECT_RE.test(ch)
          )

          if (!isValidCharacterString) return

          const parsedValue = parseNumber(
            targetValue,
            locale(),
            formatOptionsRef.current
          )

          inputValueAssign(targetValue)

          if (parsedValue !== null) {
            setValue(
              parsedValue,
              createChangeEventDetails(REASONS.inputChange, event)
            )
          }
        },
        onKeyDown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
          if (event.defaultPrevented || state.readOnly || state.disabled) {
            return
          }

          const hadManualInput = !allowInputSyncRef.current

          const allowedNonNumericKeys = getAllowedNonNumericKeys()

          let isAllowedNonNumericKey = allowedNonNumericKeys.has(event.key)

          const { decimal, currency, percentSign } = getNumberLocaleDetails(
            locale(),
            formatOptionsRef.current
          )

          const selectionStart = event.currentTarget.selectionStart
          const selectionEnd = event.currentTarget.selectionEnd
          const isAllSelected =
            selectionStart === 0 && selectionEnd === state.inputValue.length

          const selectionContainsIndex = (index: number) =>
            selectionStart != null &&
            selectionEnd != null &&
            index >= selectionStart &&
            index < selectionEnd

          const signGroups = [
            [ANY_MINUS_DETECT_RE, ANY_MINUS_RE],
            [ANY_PLUS_DETECT_RE, ANY_PLUS_RE],
          ] as const
          signGroups.forEach(([detectRe, globalRe]) => {
            if (
              detectRe.test(event.key) &&
              Array.from(allowedNonNumericKeys).some(k => detectRe.test(k))
            ) {
              const existingIndex = state.inputValue.search(globalRe)
              const isReplacingExisting =
                existingIndex !== -1 && selectionContainsIndex(existingIndex)
              isAllowedNonNumericKey =
                !(
                  ANY_MINUS_DETECT_RE.test(state.inputValue) ||
                  ANY_PLUS_DETECT_RE.test(state.inputValue)
                ) ||
                isAllSelected ||
                isReplacingExisting
            }
          })

          ;[decimal, currency, percentSign].forEach(symbol => {
            if (event.key === symbol) {
              const symbolIndex = state.inputValue.indexOf(symbol)
              const isSymbolHighlighted = selectionContainsIndex(symbolIndex)
              isAllowedNonNumericKey =
                symbolIndex === -1 || isAllSelected || isSymbolHighlighted
            }
          })

          const isNavigateKey = NAVIGATE_KEYS.has(event.key)
          const isStepKey = event.key === 'ArrowUp' || event.key === 'ArrowDown'

          if (
            event.which === 229 ||
            (event.altKey && !isStepKey) ||
            event.ctrlKey ||
            event.metaKey ||
            isAllowedNonNumericKey ||
            isNumeralChar(event.key) ||
            isNavigateKey
          ) {
            return
          }

          let boundaryValue: number | null = null
          if (event.key === 'Home' && min() != null) {
            boundaryValue = min()!
          } else if (event.key === 'End' && max() != null) {
            boundaryValue = max()!
          }

          if (event.key.length > 1 && !isStepKey && boundaryValue === null) {
            return
          }

          const currentValue = hadManualInput
            ? parseNumber(state.inputValue, locale(), formatOptionsRef.current)
            : null

          const amount = getStepAmount(event)

          event.preventDefault()
          event.stopPropagation()

          const commitDetails = createGenericEventDetails(
            REASONS.keyboard,
            event
          )

          let changed = false
          if (isStepKey || boundaryValue !== null) {
            allowInputSyncRef.current = true
          }
          if (isStepKey) {
            if (!hadManualInput) {
              lastChangedValueRef.current = valueRef.current
            }

            changed = incrementValue(amount, {
              direction: event.key === 'ArrowUp' ? 1 : -1,
              currentValue,
              event,
              reason: REASONS.keyboard,
            })
          } else if (boundaryValue !== null) {
            changed = setValue(
              boundaryValue,
              createChangeEventDetails(REASONS.keyboard, event)
            )
          }

          if (changed) {
            onValueCommitted(lastChangedValueRef.current, commitDetails)
          }
        },
        onPaste(event: ClipboardEvent & { currentTarget: HTMLInputElement }) {
          if (event.defaultPrevented || state.readOnly || state.disabled) {
            return
          }

          let pastedData = ''

          try {
            pastedData = event.clipboardData?.getData('text/plain') ?? ''
          } catch {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                '<NumberField.Input> could not read clipboard text during paste handling.'
              )
            }
            return
          }

          event.preventDefault()

          const input = event.currentTarget
          const selectionStart = input.selectionStart!
          const selectionEnd = input.selectionEnd!
          const nextText =
            state.inputValue.slice(0, selectionStart) +
            pastedData +
            state.inputValue.slice(selectionEnd)

          const parsedValue = parseNumber(
            nextText,
            locale(),
            formatOptionsRef.current
          )

          if (parsedValue !== null) {
            allowInputSyncRef.current = false
            pendingCaretRef.current = selectionStart + pastedData.length
            setValue(
              parsedValue,
              createChangeEventDetails(REASONS.inputPaste, event)
            )
            inputValueAssign(nextText)
          }
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
      },
      // Consumer props next (matches FieldControl / Radio a11y merge order).
      elementProps as Record<string, unknown>,
      // Validation / description attrs last so they compose external
      // `aria-describedby` instead of being clobbered by elementProps.
      {
        get 'aria-describedby'() {
          const external = (elementProps as Record<string, unknown>)[
            'aria-describedby'
          ]
          return field.validation.getValidationProps(
            state.disabled,
            external != null ? { 'aria-describedby': external } : {}
          )['aria-describedby']
        },
        get 'aria-invalid'() {
          return field.validation.getValidationProps(state.disabled)[
            'aria-invalid'
          ]
        },
      }
    ),
  })
}

export interface NumberFieldInputState extends NumberFieldRootState {}

export interface NumberFieldInputProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  /**
   * A user-friendly description of the input's role for assistive tech.
   * @default 'Number field'
   */
  'aria-roledescription'?: string | undefined
  render?: RenderProp<NumberFieldInputState, Record<string, unknown>>
  ref?: ((element: Element) => void) | undefined
}
