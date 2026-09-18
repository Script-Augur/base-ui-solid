import { createContext, useContext } from 'solid-js'

import type { MenuStore } from '../store/MenuStore'

/**
 * Marks a nested {@link MenuRoot} as a submenu.
 */
export const MenuSubmenuRootContext =
  createContext<MenuSubmenuRootContextValue>()

/**
 * Reads submenu context when present.
 *
 * @returns Submenu context, or `undefined` outside a submenu root.
 */
export function useMenuSubmenuRootContext():
  | MenuSubmenuRootContextValue
  | undefined {
  return useContext(MenuSubmenuRootContext)
}

/** Value published by {@link MenuSubmenuRoot}. */
export type MenuSubmenuRootContextValue = {
  parentMenu: MenuStore
}
