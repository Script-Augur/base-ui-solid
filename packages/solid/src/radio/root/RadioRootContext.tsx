import { createContext, useContext } from 'solid-js'

import type { RadioRootState } from './RadioRoot'

export const RadioRootContext = createContext<RadioRootContextValue | null>(
  null
)

/**
 * Reads the nearest Radio root context.
 *
 * @returns The radio root state.
 * @throws If used outside `<Radio.Root>`.
 */
export function useRadioRootContext(): RadioRootContextValue {
  const context = useContext(RadioRootContext)
  if (context === null) {
    throw new Error(
      'Base UI: RadioRootContext is missing. Radio parts must be placed within <Radio.Root>.'
    )
  }
  return context
}

export type RadioRootContextValue = RadioRootState
