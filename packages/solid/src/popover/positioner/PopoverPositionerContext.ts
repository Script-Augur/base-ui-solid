import { createContext, useContext } from 'solid-js'

import type { Align, Side } from './placement'
import type { Accessor } from 'solid-js'

/**
 * Positioning state published by {@link PopoverPositioner}.
 */
export const PopoverPositionerContext =
  createContext<PopoverPositionerContextValue>()

/**
 * Reads the nearest {@link PopoverPositioner} context.
 *
 * @returns Positioner context value.
 */
export function usePopoverPositionerContext(): PopoverPositionerContextValue {
  const context = useContext(PopoverPositionerContext)
  if (context == null) {
    throw new Error(
      'Base UI: PopoverPositioner parts must be used within <Popover.Positioner>.'
    )
  }
  return context
}

/**
 * Context value from {@link PopoverPositioner}.
 */
export interface PopoverPositionerContextValue {
  side: Accessor<Side>
  align: Accessor<Align>
  arrowRef: (element: HTMLElement | null) => void
  arrowUncentered: Accessor<boolean>
  arrowStyles: Accessor<Record<string, string | undefined>>
}
