import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

export const NumberFieldScrubAreaContext =
  createContext<NumberFieldScrubAreaContextValue | null>(null)
/**
 * Reads the nearest NumberField scrub area context.
 *
 * @throws If used outside `<NumberField.ScrubArea>`.
 */
export function useNumberFieldScrubAreaContext(): NumberFieldScrubAreaContextValue {
  const context = useContext(NumberFieldScrubAreaContext)
  if (context === null) {
    throw new Error(
      'Base UI: NumberFieldScrubAreaContext is missing. NumberFieldScrubArea parts must be placed within <NumberField.ScrubArea>.'
    )
  }
  return context
}
export interface NumberFieldScrubAreaContextValue {
  isScrubbing: Accessor<boolean>
  isTouchInput: Accessor<boolean>
  isPointerLockDenied: Accessor<boolean>
  scrubAreaCursorRef: { current: HTMLSpanElement | null }
  assignScrubAreaCursorRef: (element: HTMLSpanElement | null) => void
}
