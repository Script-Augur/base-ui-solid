import { createContext, useContext } from 'solid-js'

/**
 * Whether the portal should stay mounted while closed.
 * Published by {@link NavigationMenuPortal}.
 */
export const NavigationMenuPortalContext = createContext<boolean>(false)

/**
 * Reads keepMounted from the nearest {@link NavigationMenuPortal}.
 *
 * @returns `true` when keepMounted was set on the portal.
 */
export function useNavigationMenuPortalContext(): boolean {
  return useContext(NavigationMenuPortalContext)
}
