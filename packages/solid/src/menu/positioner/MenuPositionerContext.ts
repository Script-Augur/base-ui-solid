import { createContext, useContext } from 'solid-js'

import type { Align, Side } from './placement'
import type { Accessor } from 'solid-js'

/**
 * Positioner-published side/align/arrow data for Popup / Arrow.
 */
export const MenuPositionerContext =
  createContext<MenuPositionerContextValue>()

/**
 * Reads the nearest Menu positioner context.
 *
 * @param optional - When `true`, returns `undefined` outside a positioner.
 */
export function useMenuPositionerContext(
  optional?: false
): MenuPositionerContextValue
export function useMenuPositionerContext(
  optional: true
): MenuPositionerContextValue | undefined
export function useMenuPositionerContext(
  optional = false
): MenuPositionerContextValue | undefined {
  const context = useContext(MenuPositionerContext)
  if (context == null && !optional) {
    throw new Error(
      'Base UI: Menu.Arrow must be used within Menu.Positioner.'
    )
  }
  return context
}

/** Value published by {@link MenuPositioner}. */
export type MenuPositionerContextValue = {
  side: Accessor<Side>
  align: Accessor<Align>
  arrowRef: (el: HTMLElement | null) => void
  arrowUncentered: Accessor<boolean>
  arrowStyles: Accessor<Record<string, string | undefined>>
  /** Floating node id for this menu (submenu tree). Lite: undefined. */
  nodeId?: string
}
