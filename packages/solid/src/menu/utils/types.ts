import type { MenuStore } from '../store/MenuStore'

/**
 * Parent relationship for a Menu root (submenu / menubar / context-menu).
 * Menubar and Context Menu packages fill their context shapes later.
 */
export type MenuParent =
  | {
      type: 'menu'
      store: MenuStore
    }
  | {
      type: 'menubar'
      context: {
        disabled?: boolean
        rootId?: string
        orientation?: 'horizontal' | 'vertical'
        allowMouseUpTriggerRef: { current: boolean }
      }
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
