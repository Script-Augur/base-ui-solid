import { createContext, useContext } from 'solid-js'

import type { Align, Side } from './placement'
import type { Accessor } from 'solid-js'

/**
 * Positioning state published by {@link TooltipPositioner}.
 */
export const TooltipPositionerContext =
  createContext<TooltipPositionerContextValue>()

/**
 * Reads the nearest {@link TooltipPositioner} context.
 *
 * @returns Positioner context value.
 */
export function useTooltipPositionerContext(): TooltipPositionerContextValue {
  const context = useContext(TooltipPositionerContext)
  if (context == null) {
    throw new Error(
      'Base UI: TooltipPositioner parts must be used within <Tooltip.Positioner>.'
    )
  }
  return context
}

/**
 * Context value from {@link TooltipPositioner}.
 */
export interface TooltipPositionerContextValue {
  side: Accessor<Side>
  align: Accessor<Align>
  arrowRef: (element: HTMLElement | null) => void
  arrowUncentered: Accessor<boolean>
  arrowStyles: Accessor<Record<string, string | undefined>>
}
