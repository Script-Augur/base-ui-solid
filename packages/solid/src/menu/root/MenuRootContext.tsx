import { createContext, useContext } from 'solid-js'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { MenuStore } from '../store/MenuStore'
import type { MenuParent } from '../utils/types'
import type { Accessor, Setter } from 'solid-js'

/**
 * Shared Menu root state for compound parts.
 */
export const MenuRootContext = createContext<MenuRootContextValue>()

/**
 * Reads the nearest {@link MenuRoot} context.
 *
 * @param optional - When `true`, returns `undefined` outside a root.
 * @returns Context value, or `undefined` when `optional` and no provider.
 */
export function useMenuRootContext(optional?: false): MenuRootContextValue
export function useMenuRootContext(
  optional: true
): MenuRootContextValue | undefined
export function useMenuRootContext(
  optional = false
): MenuRootContextValue | undefined {
  const context = useContext(MenuRootContext)
  if (context == null && !optional) {
    throw new Error('Base UI: Menu parts must be used within <Menu.Root>.')
  }
  return context
}

/**
 * Context value published by {@link MenuRoot}.
 */
export interface MenuRootContextValue {
  /** Popup-handle store for this root (source of truth for open). */
  store: MenuStore
  parent: MenuParent
  open: Accessor<boolean>
  setOpen: (
    next: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
  modal: Accessor<boolean>
  nested: Accessor<boolean>
  mounted: Accessor<boolean>
  mountedAssign: Setter<boolean>
  transitionStatus: Accessor<TransitionStatus>
  popupElement: Accessor<HTMLElement | null>
  popupElementAssign: Setter<HTMLElement | null>
  positionerElement: Accessor<HTMLElement | null>
  positionerElementAssign: Setter<HTMLElement | null>
  viewportElement: Accessor<HTMLElement | null>
  viewportElementAssign: Setter<HTMLElement | null>
  triggerElement: Accessor<HTMLElement | null>
  triggerElementAssign: Setter<HTMLElement | null>
  backdropElement: Accessor<HTMLElement | null>
  backdropElementAssign: Setter<HTMLElement | null>
  internalBackdropElement: Accessor<HTMLElement | null>
  internalBackdropElementAssign: Setter<HTMLElement | null>
  arrowElement: Accessor<HTMLElement | null>
  arrowElementAssign: Setter<HTMLElement | null>
  portalId: Accessor<string>
  preventUnmountOnClose: Accessor<boolean>
  preventUnmountOnCloseAssign: Setter<boolean>
  popupFinalFocus: Accessor<boolean | HTMLElement | null | undefined>
  popupFinalFocusAssign: Setter<boolean | HTMLElement | null | undefined>
  openChangeReason: Accessor<ChangeEventReason | null>
  instantType: Accessor<string | undefined>
  orientation: Accessor<'horizontal' | 'vertical'>
  loopFocus: Accessor<boolean>
  highlightItemOnHover: Accessor<boolean>
  registerItem: (element: HTMLElement, label: string | null) => () => void
  onPopupKeyDown: (event: KeyboardEvent) => void
  onOpenChangeComplete?: (open: boolean) => void
}
