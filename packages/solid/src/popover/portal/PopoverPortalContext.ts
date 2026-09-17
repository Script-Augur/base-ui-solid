import { createContext, useContext } from 'solid-js'

/**
 * Whether the portal should stay mounted while closed.
 * Published by {@link PopoverPortal}.
 */
export const PopoverPortalContext = createContext<boolean>(false)

/**
 * Reads keepMounted from the nearest {@link PopoverPortal}.
 *
 * @returns `true` when keepMounted was set on the portal.
 */
export function usePopoverPortalContext(): boolean {
  return useContext(PopoverPortalContext)
}
