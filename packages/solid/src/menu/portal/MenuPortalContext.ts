import { createContext, useContext } from 'solid-js'

/**
 * Publishes portal `keepMounted` to positioner/popup descendants.
 */
export const MenuPortalContext = createContext<boolean>(false)

/**
 * Reads whether the portal keeps content mounted while closed.
 *
 * @returns `keepMounted` value from the nearest portal.
 */
export function useMenuPortalContext(): boolean {
  return useContext(MenuPortalContext)
}
