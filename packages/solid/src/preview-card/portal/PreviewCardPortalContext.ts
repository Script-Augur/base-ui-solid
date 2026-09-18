import { createContext, useContext } from 'solid-js'

/**
 * Whether the portal should stay mounted while closed.
 * Published by {@link PreviewCardPortal}.
 */
export const PreviewCardPortalContext = createContext<boolean>(false)

/**
 * Reads keepMounted from the nearest {@link PreviewCardPortal}.
 *
 * @returns `true` when keepMounted was set on the portal.
 */
export function usePreviewCardPortalContext(): boolean {
  return useContext(PreviewCardPortalContext)
}
