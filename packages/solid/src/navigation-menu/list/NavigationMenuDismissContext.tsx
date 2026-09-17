import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Dismiss props published by {@link NavigationMenuList} for triggers.
 * Lite: only a flag that dismiss is active while open.
 */
export const NavigationMenuDismissContext =
  createContext<NavigationMenuDismissContextValue>()

/**
 * Reads dismiss context from the nearest List (optional).
 *
 * @returns Dismiss context or `undefined`.
 */
export function useNavigationMenuDismissContext():
  NavigationMenuDismissContextValue | undefined {
  return useContext(NavigationMenuDismissContext)
}

/**
 * Lite dismiss context value.
 */
export interface NavigationMenuDismissContextValue {
  enabled: Accessor<boolean>
}
