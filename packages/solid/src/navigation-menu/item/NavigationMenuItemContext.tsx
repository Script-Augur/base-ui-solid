import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Per-item value context for Trigger / Content / Icon.
 */
export const NavigationMenuItemContext =
  createContext<NavigationMenuItemContextValue>()

/**
 * Reads the nearest {@link NavigationMenuItem} context.
 *
 * @returns Item context value.
 */
export function useNavigationMenuItemContext(): NavigationMenuItemContextValue {
  const context = useContext(NavigationMenuItemContext)
  if (context == null) {
    throw new Error(
      'Base UI: NavigationMenuItemContext is missing. Navigation Menu parts must be placed within <NavigationMenu.Item>.'
    )
  }
  return context
}

/**
 * Context value published by {@link NavigationMenuItem}.
 */
export interface NavigationMenuItemContextValue {
  value: Accessor<unknown>
}
