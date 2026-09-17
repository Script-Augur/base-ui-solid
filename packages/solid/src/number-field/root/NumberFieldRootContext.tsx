import { createContext, useContext } from 'solid-js'

import type {
  NumberFieldRootChangeEventDetails,
  NumberFieldRootCommitEventDetails,
  NumberFieldRootState,
} from './NumberFieldRoot'
import type {
  EventWithOptionalKeyState,
  IncrementValueParameters,
} from '../utils/types'
import type { Accessor, Setter } from 'solid-js'

export const NumberFieldRootContext =
  createContext<NumberFieldRootContextValue | null>(null)
/**
 * Reads the nearest NumberField root context.
 *
 * @returns Context value for nested NumberField parts.
 * @throws If used outside `<NumberField.Root>`.
 */
export function useNumberFieldRootContext(): NumberFieldRootContextValue {
  const context = useContext(NumberFieldRootContext)
  if (context === null) {
    throw new Error(
      'Base UI: NumberFieldRootContext is missing. NumberField parts must be placed within <NumberField.Root>.'
    )
  }
  return context
}
export type InputMode = 'numeric' | 'decimal' | 'text'
export interface NumberFieldRootContextValue {
  minWithDefault: Accessor<number>
  maxWithDefault: Accessor<number>
  id: Accessor<string | undefined>
  setValue: (
    value: number | null,
    details: NumberFieldRootChangeEventDetails
  ) => boolean
  getStepAmount: (event?: EventWithOptionalKeyState) => number
  incrementValue: (amount: number, params: IncrementValueParameters) => boolean
  inputRef: { current: HTMLInputElement | null }
  assignInputRef: (element: HTMLInputElement | null) => void
  allowInputSyncRef: { current: boolean }
  formatOptionsRef: { current: Intl.NumberFormatOptions | undefined }
  valueRef: { current: number | null }
  lastChangedValueRef: { current: number | null }
  hasPendingCommitRef: { current: boolean }
  name: Accessor<string | undefined>
  nameProp: Accessor<string | undefined>
  inputMode: Accessor<InputMode>
  getAllowedNonNumericKeys: () => Set<string>
  min: Accessor<number | undefined>
  max: Accessor<number | undefined>
  inputValueAssign: Setter<string>
  locale: Accessor<Intl.LocalesArgument | undefined>
  isScrubbingAssign: Setter<boolean>
  state: NumberFieldRootState
  onValueCommitted: (
    value: number | null,
    eventDetails: NumberFieldRootCommitEventDetails
  ) => void
}
