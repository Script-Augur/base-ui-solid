import { generateId } from '@script-augur/base-ui-utils'
import { createSignal, splitProps } from 'solid-js'

import { MenuRoot } from '../../menu/root/MenuRoot'
import { MenuRootContext } from '../../menu/root/MenuRootContext'

import { ContextMenuRootContext } from './ContextMenuRootContext'

import type {
  ContextMenuActions,
  ContextMenuAnchor,
  ContextMenuRootContextValue,
} from './ContextMenuRootContext'
import type {
  MenuRootActions,
  MenuRootChangeEventDetails,
  MenuRootChangeEventReason,
  MenuRootProps,
} from '../../menu/root/MenuRoot'
import type { JSX } from 'solid-js'
/**
 * A component that creates a context menu activated by right clicking or long pressing.
 * Doesn't render its own HTML element.
 *
 * Thin wrapper over {@link MenuRoot}: provides cursor-anchor context, clears any outer
 * {@link MenuRootContext} so the nested menu is not treated as a submenu, and omits
 * handle / trigger-id / modal props unsupported on Context Menu (matches upstream
 * `@base-ui/react@1.7.0`).
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 *
 * @param componentProps - Root props.
 * @returns Children wrapped in context-menu + menu context.
 */
export function ContextMenuRoot(
  componentProps: ContextMenuRootProps
): JSX.Element {
  const [local, menuProps] = splitProps(componentProps, [
    'children',
    'onOpenChange',
  ])

  const [anchor, anchorAssign] = createSignal<ContextMenuAnchor>(emptyAnchor())

  const backdropRef: ContextMenuRootContextValue['backdropRef'] = {
    current: null,
  }
  const internalBackdropRef: ContextMenuRootContextValue['internalBackdropRef'] =
    { current: null }
  const actionsRef: { current: ContextMenuActions | null } = { current: null }
  const positionerRef: { current: HTMLElement | null } = { current: null }
  const allowMouseUpTriggerRef = { current: true }
  const initialCursorPointRef: {
    current: { x: number; y: number } | null
  } = { current: null }
  const rootId = generateId('base-ui-context-menu-root')

  const contextValue: ContextMenuRootContextValue = {
    anchor,
    anchorAssign,
    backdropRef,
    internalBackdropRef,
    actionsRef,
    positionerRef,
    allowMouseUpTriggerRef,
    initialCursorPointRef,
    rootId,
  }

  return (
    <ContextMenuRootContext.Provider value={contextValue}>
      {/* Clear outer Menu context so nested Menu.Root is a context-menu parent, not a submenu. */}
      <MenuRootContext.Provider value={undefined}>
        <MenuRoot {...menuProps} onOpenChange={local.onOpenChange}>
          {local.children}
        </MenuRoot>
      </MenuRootContext.Provider>
    </ContextMenuRootContext.Provider>
  )
}
/**
 * Props for {@link ContextMenuRoot}.
 *
 * Omits Menu handle / trigger-id / modal APIs — Context Menu always uses cursor
 * anchoring and does not support detached triggers yet (upstream 1.7.0).
 */
export type ContextMenuRootProps = Omit<
  MenuRootProps,
  | 'handle'
  | 'triggerId'
  | 'defaultTriggerId'
  | 'modal'
  | 'onOpenChange'
  | 'children'
> & {
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: ContextMenuRootChangeEventDetails
  ) => void
  children?: JSX.Element
}
/** Imperative actions exposed via `actionsRef`. */
export type ContextMenuRootActions = MenuRootActions
/** Change-event reason for Context Menu. */
export type ContextMenuRootChangeEventReason = MenuRootChangeEventReason
/** Change-event details for Context Menu. */
export type ContextMenuRootChangeEventDetails = MenuRootChangeEventDetails
export type { ContextMenuRootContextValue }
function emptyAnchor(): ContextMenuAnchor {
  return {
    getBoundingClientRect() {
      return DOMRect.fromRect({
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      })
    },
  }
}
