import { createContext, useContext } from 'solid-js'

import type { Align, Side } from './placement'
import type { Accessor } from 'solid-js'

/**
 * Positioning data for Arrow and Popup.
 */
export const NavigationMenuPositionerContext =
  createContext<NavigationMenuPositionerContextValue>()

/**
 * Reads the nearest {@link NavigationMenuPositioner} context.
 *
 * @param optional - When `true`, returns `undefined` outside a positioner.
 * @returns Context value, or `undefined` when optional and missing.
 */
export function useNavigationMenuPositionerContext(
  optional?: false
): NavigationMenuPositionerContextValue
export function useNavigationMenuPositionerContext(
  optional: true
): NavigationMenuPositionerContextValue | undefined
export function useNavigationMenuPositionerContext(
  optional = false
): NavigationMenuPositionerContextValue | undefined {
  const context = useContext(NavigationMenuPositionerContext)
  if (context == null && !optional) {
    throw new Error(
      'Base UI: NavigationMenuPositionerContext is missing. Navigation Menu Arrow/Popup must be placed within <NavigationMenu.Positioner>.'
    )
  }
  return context
}

/**
 * Context value published by {@link NavigationMenuPositioner}.
 */
export interface NavigationMenuPositionerContextValue {
  side: Accessor<Side>
  align: Accessor<Align>
  arrowRef: (el: HTMLElement | null) => void
  arrowUncentered: Accessor<boolean>
  arrowStyles: Accessor<Record<string, string | undefined>>
}
