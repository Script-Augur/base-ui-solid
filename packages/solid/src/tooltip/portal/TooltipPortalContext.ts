import { createContext, useContext } from 'solid-js'

/**
 * Whether the portal should stay mounted while closed.
 * Published by {@link TooltipPortal}.
 */
export const TooltipPortalContext = createContext<boolean>(false)

/**
 * Reads keepMounted from the nearest {@link TooltipPortal}.
 *
 * @returns `true` when keepMounted was set on the portal.
 */
export function useTooltipPortalContext(): boolean {
  return useContext(TooltipPortalContext)
}
