import { createContext, useContext } from 'solid-js'

import type { Accessor, Setter } from 'solid-js'

/**
 * Context value for nested {@link Portal} instances and overlay focus wiring.
 */
export const PortalContext = createContext<PortalContextValue | null>(null)

/**
 * Reads the nearest {@link Portal} context, or `null` outside a portal.
 */
export function usePortalContext(): PortalContextValue | null {
  return useContext(PortalContext)
}

/**
 * Context value for nested {@link Portal} instances and overlay focus wiring.
 */
export interface PortalContextValue {
  /** Host element the portal children were mounted into. */
  portalNode: Accessor<HTMLElement | null>
  /**
   * Overlay focus-manager state (Dialog/Popover non-modal tab order).
   * Set by floating focus managers; unused by Portal itself in the Lite path.
   */
  focusManagerState: Accessor<PortalFocusManagerState | null>
  /** Assign focus-manager state from an overlay. */
  focusManagerStateAssign: Setter<PortalFocusManagerState | null>
}

/**
 * Focus-manager payload overlays publish into portal context (upstream
 * `FloatingPortal` / focus manager contract).
 */
export type PortalFocusManagerState = {
  modal: boolean
  open: boolean
  onOpenChange: (
    open: boolean,
    data?: { reason?: string; event?: Event }
  ) => void
  domReference: Element | null
  closeOnFocusOut: boolean
}
