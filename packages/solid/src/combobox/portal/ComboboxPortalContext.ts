import { createContext, useContext } from 'solid-js'

/**
 * Whether the portal should stay mounted while closed.
 * Published by {@link ComboboxPortal}.
 */
export const ComboboxPortalContext = createContext<boolean>(false)

/**
 * Reads keepMounted from the nearest {@link ComboboxPortal}.
 *
 * @returns `true` when keepMounted was set on the portal.
 */
export function useComboboxPortalContext(): boolean {
  return useContext(ComboboxPortalContext)
}
