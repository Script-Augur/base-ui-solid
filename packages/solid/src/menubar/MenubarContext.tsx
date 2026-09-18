import { createContext, useContext } from 'solid-js'

import type { FloatingTreeStore } from '../internals/popups'
import type { Accessor, Setter } from 'solid-js'

const MenubarContext = createContext<MenubarContextValue | null>(null)
export { MenubarContext }
/**
 * Reads the nearest {@link Menubar} context.
 *
 * @param optional - When `true`, returns `null` outside a Menubar instead of throwing.
 * @returns Menubar context, or `null` when `optional` and missing.
 */
export function useMenubarContext(optional?: false): MenubarContextValue
export function useMenubarContext(optional: true): MenubarContextValue | null
export function useMenubarContext(
  optional?: boolean
): MenubarContextValue | null {
  const context = useContext(MenubarContext)
  if (context === null && !optional) {
    throw new Error(
      'Base UI: MenubarContext is missing. Menubar parts must be placed within <Menubar>.'
    )
  }
  return context
}
/**
 * Context provided by {@link Menubar} to nested Menu roots / triggers.
 */
export interface MenubarContextValue {
  modal: boolean
  disabled: boolean
  contentElement: Accessor<HTMLElement | null>
  contentElementAssign: Setter<HTMLElement | null>
  hasSubmenuOpen: Accessor<boolean>
  hasSubmenuOpenAssign: Setter<boolean>
  orientation: 'horizontal' | 'vertical'
  allowMouseUpTriggerRef: { current: boolean }
  rootId: string | undefined
  /**
   * Shared lite floating tree for menus under this menubar (Solid substitute for
   * React `FloatingTree` context).
   */
  floatingTreeRoot: FloatingTreeStore
  /** Floating node id for the menubar root (parent of top-level menus). */
  floatingNodeId: string
}
