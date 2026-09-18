import { createContext, useContext } from 'solid-js'

import type {
  OTPFieldRootChangeEventDetails,
  OTPFieldRootInvalidEventDetails,
  OTPFieldRootState,
} from './OTPFieldRoot'
import type { OTPFieldInputState } from '../input/OTPFieldInput'
import type { OTPValidationType } from '../utils/otp'
import type { Accessor, JSX } from 'solid-js'

export const OTPFieldRootContext =
  createContext<OTPFieldRootContextValue | null>(null)

/**
 * Reads the nearest OTP Field root context.
 *
 * @returns Context value for nested OTP Field parts.
 * @throws If used outside `<OTPField.Root>`.
 */
export function useOTPFieldRootContext(): OTPFieldRootContextValue {
  const context = useContext(OTPFieldRootContext)
  if (context === null) {
    throw new Error(
      'Base UI: OTPFieldRootContext is missing. OTPField parts must be placed within <OTPField.Root>.'
    )
  }
  return context
}

/**
 * Builds per-slot input state from the root state.
 * Uses getters so Solid `data-*` mapping stays reactive.
 */
export function getOTPFieldInputState(
  state: OTPFieldRootState,
  getValue: () => string,
  getIndex: () => number
): OTPFieldInputState {
  return {
    get complete() {
      return state.complete
    },
    get disabled() {
      return state.disabled
    },
    get focused() {
      return state.focused
    },
    get length() {
      return state.length
    },
    get readOnly() {
      return state.readOnly
    },
    get required() {
      return state.required
    },
    get valid() {
      return state.valid
    },
    get touched() {
      return state.touched
    },
    get dirty() {
      return state.dirty
    },
    get filled() {
      return getValue() !== ''
    },
    get index() {
      return getIndex()
    },
    get value() {
      return getValue()
    },
  }
}

export interface OTPFieldRootContextValue {
  activeIndex: Accessor<number>
  autoComplete: Accessor<string | undefined>
  disabled: Accessor<boolean>
  form: Accessor<string | undefined>
  focusInput: (index: number) => void
  queueFocusInput: (index: number, value: string) => void
  getInputId: (index: number) => string | undefined
  handleInputBlur: (
    event: FocusEvent & { currentTarget: HTMLInputElement }
  ) => void
  handleInputFocus: (
    index: number,
    event: FocusEvent & { currentTarget: HTMLInputElement }
  ) => void
  inputMode: Accessor<JSX.HTMLAttributes<HTMLInputElement>['inputMode']>
  inputAriaLabelledBy: Accessor<string | undefined>
  invalid: Accessor<boolean | undefined>
  length: Accessor<number>
  mask: Accessor<boolean>
  pattern: Accessor<string | undefined>
  reportValueInvalid: (
    value: string,
    details: OTPFieldRootInvalidEventDetails
  ) => void
  readOnly: Accessor<boolean>
  required: Accessor<boolean>
  normalizeValue: Accessor<((value: string) => string) | undefined>
  setValue: (
    value: string,
    details: OTPFieldRootChangeEventDetails
  ) => string | null
  state: OTPFieldRootState
  validationType: Accessor<OTPValidationType>
  value: Accessor<string>
}
