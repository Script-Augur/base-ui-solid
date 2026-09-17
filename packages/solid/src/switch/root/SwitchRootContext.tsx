import { createContext, useContext } from 'solid-js'

import type { SwitchRootState } from './SwitchRoot'

export const SwitchRootContext = createContext<SwitchRootContextValue | null>(
  null
)
/**
 * Reads the nearest Switch root context.
 *
 * @returns The switch root state.
 * @throws If used outside `<Switch.Root>`.
 */
export function useSwitchRootContext(): SwitchRootContextValue {
  const context = useContext(SwitchRootContext)
  if (context === null) {
    throw new Error(
      'Base UI: SwitchRootContext is missing. Switch parts must be placed within <Switch.Root>.'
    )
  }
  return context
}
export type SwitchRootContextValue = SwitchRootState
