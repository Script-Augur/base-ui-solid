import type { MenubarContextValue } from '../../menubar/MenubarContext'
import type { MenuStore } from '../store/MenuStore'

/**
 * Parent relationship for a Menu root (submenu / menubar / context-menu).
 * Context Menu package fills its context shape later.
 */
export type MenuParent =
  | {
      type: 'menu'
      store: MenuStore
    }
  | {
      type: 'menubar'
      context: MenubarContextValue
    }
  | {
      type: 'context-menu'
      context: {
        rootId?: string
        allowMouseUpTriggerRef: { current: boolean }
        positionerRef?: { current: HTMLElement | null }
        actionsRef?: { current: { setOpen?: unknown } | null }
        initialCursorPointRef?: {
          current: { x: number; y: number } | null
        }
      }
    }
  | {
      type: 'nested-context-menu'
      context: {
        rootId?: string
        allowMouseUpTriggerRef: { current: boolean }
      }
    }
  | {
      type: undefined
    }
