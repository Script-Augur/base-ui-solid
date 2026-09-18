import { createContext, useContext } from 'solid-js'

/**
 * Whether the portal should stay mounted while closed.
 * Published by {@link SelectPortal}.
 */
export const SelectPortalContext = createContext<boolean>(false)

/**
 * Reads keepMounted from the nearest {@link SelectPortal}.
 *
 * @returns `true` when keepMounted was set on the portal.
 */
export function useSelectPortalContext(): boolean {
  return useContext(SelectPortalContext)
}
