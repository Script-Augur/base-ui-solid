import { createContext, useContext } from 'solid-js'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { Accessor } from 'solid-js'

/**
 * Shared Context Menu root state for compound parts.
 */
export const ContextMenuRootContext =
  createContext<ContextMenuRootContextValue>()

/**
 * Reads the nearest {@link ContextMenuRoot} context.
 *
 * @param optional - When `true`, returns `undefined` outside a root.
 * @returns Context value, or `undefined` when `optional` and no provider.
 */
export function useContextMenuRootContext(
  optional?: false
): ContextMenuRootContextValue
export function useContextMenuRootContext(
  optional: true
): ContextMenuRootContextValue | undefined
export function useContextMenuRootContext(
  optional = false
): ContextMenuRootContextValue | undefined {
  const context = useContext(ContextMenuRootContext)
  if (context == null && !optional) {
    throw new Error(
      'Base UI: ContextMenuRootContext is missing. ContextMenu parts must be placed within <ContextMenu.Root>.'
    )
  }
  return context
}

/**
 * Virtual reference used to position the menu at the cursor / long-press point.
 */
export type ContextMenuAnchor = {
  getBoundingClientRect: () => DOMRect
}

/**
 * Imperative open API exposed to {@link ContextMenuTrigger}.
 */
export type ContextMenuActions = {
  setOpen: (
    nextOpen: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
}

/**
 * Context value published by {@link ContextMenuRoot}.
 */
export interface ContextMenuRootContextValue {
  anchor: Accessor<ContextMenuAnchor>
  anchorAssign: (anchor: ContextMenuAnchor) => void
  backdropRef: { current: HTMLDivElement | null }
  internalBackdropRef: { current: HTMLDivElement | null }
  actionsRef: { current: ContextMenuActions | null }
  positionerRef: { current: HTMLElement | null }
  allowMouseUpTriggerRef: { current: boolean }
  initialCursorPointRef: { current: { x: number; y: number } | null }
  rootId: string
}
