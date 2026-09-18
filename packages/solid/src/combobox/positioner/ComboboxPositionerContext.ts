import { createContext, useContext } from 'solid-js'

import type { Align, Side } from './placement'
import type { Accessor } from 'solid-js'

/**
 * Positioning state published by {@link ComboboxPositioner}.
 */
export const ComboboxPositionerContext =
  createContext<ComboboxPositionerContextValue>()

/**
 * Reads the nearest {@link ComboboxPositioner} context.
 *
 * @returns Positioner context value.
 */
export function useComboboxPositionerContext(): ComboboxPositionerContextValue {
  const context = useContext(ComboboxPositionerContext)
  if (context == null) {
    throw new Error(
      'Base UI: Combobox.Positioner parts must be used within <Combobox.Positioner>.'
    )
  }
  return context
}

/**
 * Context value from {@link ComboboxPositioner}.
 */
export interface ComboboxPositionerContextValue {
  side: Accessor<Side>
  align: Accessor<Align>
  arrowRef: (element: HTMLElement | null) => void
  arrowUncentered: Accessor<boolean>
  arrowStyles: Accessor<Record<string, string | undefined>>
}
