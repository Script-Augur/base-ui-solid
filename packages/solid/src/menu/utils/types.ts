import type { ContextMenuRootContextValue } from '../../context-menu/root/ContextMenuRootContext'
import type { MenuStore } from '../store/MenuStore'

/**
 * Parent relationship for a Menu root (submenu / menubar / context-menu).
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
      context: ContextMenuRootContextValue
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
