import { mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import {
  createPressAndHold,
  isTouchLikePointerType,
} from '../../internals/createPressAndHold'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { parseNumber } from '../utils/parse'
import { stateAttributesMapping } from '../utils/stateAttributesMapping'

import { useNumberFieldRootContext } from './NumberFieldRootContext'

import type {
  NumberFieldRootChangeEventReason,
  NumberFieldRootState,
} from './NumberFieldRoot'
import type { RenderProp } from '../../internals/createRender'
import type { EventWithOptionalKeyState } from '../utils/types'
import type { JSX } from 'solid-js'

const SELECT_NONE_STYLE: JSX.CSSProperties = {
  '-webkit-user-select': 'none',
  'user-select': 'none',
}
/**
 * Shared implementation for the increment and decrement stepper buttons.
 */
export function createNumberFieldStepperButton(
  componentProps: StepperButtonProps,
  isIncrement: boolean
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'ref',
    'children',
  ])

  const {
    allowInputSyncRef,
    formatOptionsRef,
    getStepAmount,
    id,
    incrementValue,
    inputRef,
    maxWithDefault,
    minWithDefault,
    setValue,
    state,
    valueRef,
    locale,
    lastChangedValueRef,
    onValueCommitted,
  } = useNumberFieldRootContext()

  const pressReason: NumberFieldRootChangeEventReason = isIncrement
    ? REASONS.incrementPress
    : REASONS.decrementPress

  const isAtBoundary = () =>
    state.value != null &&
    (isIncrement
      ? state.value >= maxWithDefault()
      : state.value <= minWithDefault())

  const disabled = () =>
    Boolean(local.disabled) || state.disabled || isAtBoundary()

  const nativeButton = () => local.nativeButton ?? true

  function commitValue(nativeEvent: Event) {
    const shouldCommitInputValue = !allowInputSyncRef.current
    allowInputSyncRef.current = true

    if (!shouldCommitInputValue) {
      lastChangedValueRef.current = valueRef.current
      return
    }

    const parsedValue = parseNumber(
      state.inputValue,
      locale(),
      formatOptionsRef.current
    )

    if (parsedValue !== null) {
      const details = createChangeEventDetails(pressReason, nativeEvent)
      setValue(parsedValue, details)

      if (!details.isCanceled) {
        valueRef.current = parsedValue
      }
    }
  }

  const { pointerHandlers, shouldSkipClick } = createPressAndHold({
    disabled: () => disabled() || state.readOnly,
    elementRef: inputRef,
    tick(triggerEvent) {
      const amount = getStepAmount(triggerEvent as EventWithOptionalKeyState)
      return incrementValue(amount, {
        direction: isIncrement ? 1 : -1,
        event: triggerEvent,
        reason: pressReason,
      })
    },
    onStop(nativeEvent: PointerEvent) {
      const committed = lastChangedValueRef.current ?? valueRef.current
      onValueCommitted(
        committed,
        createGenericEventDetails(pressReason, nativeEvent)
      )
    },
  })

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled: () => disabled() || state.readOnly,
    native: nativeButton,
    focusableWhenDisabled: true,
  })

  const buttonState: NumberFieldRootState = {
    get disabled() {
      return disabled()
    },
    get readOnly() {
      return state.readOnly
    },
    get required() {
      return state.required
    },
    get value() {
      return state.value
    },
    get inputValue() {
      return state.inputValue
    },
    get scrubbing() {
      return state.scrubbing
    },
    get touched() {
      return state.touched
    },
    get dirty() {
      return state.dirty
    },
    get valid() {
      return state.valid
    },
    get filled() {
      return state.filled
    },
    get focused() {
      return state.focused
    },
  }

  return createRender<NumberFieldRootState, Record<string, unknown>>({
    defaultElement: 'button',
    state: buttonState,
    render: local.render,
    stateAttributesMapping,
    ref: [local.ref, buttonRefAssign],
    props: mergeProps(
      {
        get disabled() {
          return disabled()
        },
        'aria-label': isIncrement ? 'Increase' : 'Decrease',
        get 'aria-controls'() {
          return id()
        },
        tabIndex: -1,
        style: SELECT_NONE_STYLE,
        ...pointerHandlers,
        onClick(event: MouseEvent) {
          const isDisabled = disabled() || state.readOnly
          if (event.defaultPrevented || isDisabled || shouldSkipClick(event)) {
            return
          }

          commitValue(event)

          const amount = getStepAmount(event)

          const prev = valueRef.current

          incrementValue(amount, {
            direction: isIncrement ? 1 : -1,
            event,
            reason: pressReason,
          })

          const committed = lastChangedValueRef.current ?? valueRef.current
          if (committed !== prev) {
            onValueCommitted(
              committed,
              createGenericEventDetails(pressReason, event)
            )
          }
        },
        onPointerDown(event: PointerEvent) {
          if (
            event.defaultPrevented ||
            state.readOnly ||
            event.button ||
            disabled()
          ) {
            return
          }

          commitValue(event)
          lastChangedValueRef.current = null

          if (!isTouchLikePointerType(event.pointerType)) {
            inputRef.current?.focus()
          }

          const handler = pointerHandlers.onPointerDown
          if (typeof handler === 'function') {
            handler(event as never)
          }
        },
        get class() {
          return local.class
        },
        children: local.children,
      },
      elementProps as Record<string, unknown>,
      getButtonProps()
    ),
  })
}
type StepperButtonProps = {
  render?: RenderProp<NumberFieldRootState, Record<string, unknown>>
  class?: string
  style?: JSX.CSSProperties | string
  disabled?: boolean
  nativeButton?: boolean
  ref?: ((element: Element) => void) | undefined
  children?: JSX.Element
} & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>
