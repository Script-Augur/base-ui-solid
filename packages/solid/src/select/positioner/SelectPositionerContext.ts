import { createContext, useContext } from 'solid-js'

import type { Align, Side } from './placement'
import type { Accessor } from 'solid-js'

/**
 * Positioning state published by {@link SelectPositioner}.
 */
export const SelectPositionerContext =
  createContext<SelectPositionerContextValue>()

/**
 * Reads the nearest {@link SelectPositioner} context.
 *
 * @returns Positioner context value.
 */
export function useSelectPositionerContext(): SelectPositionerContextValue {
  const context = useContext(SelectPositionerContext)
  if (context == null) {
    throw new Error(
      'Base UI: Select.Positioner parts must be used within <Select.Positioner>.'
    )
  }
  return context
}

/**
 * Context value from {@link SelectPositioner}.
 */
export interface SelectPositionerContextValue {
  side: Accessor<Side>
  align: Accessor<Align>
  arrowRef: (element: HTMLElement | null) => void
  arrowUncentered: Accessor<boolean>
  arrowStyles: Accessor<Record<string, string | undefined>>
}
