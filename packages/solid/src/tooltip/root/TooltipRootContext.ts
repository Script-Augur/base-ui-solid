import { createContext, useContext } from 'solid-js'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { Accessor, Setter } from 'solid-js'

/**
 * Shared Tooltip root state for compound parts.
 */
export const TooltipRootContext = createContext<TooltipRootContextValue>()

/**
 * Reads the nearest {@link TooltipRoot} context.
 *
 * @param optional - When `true`, returns `undefined` outside a root.
 * @returns Context value, or `undefined` when `optional` and no provider.
 */
export function useTooltipRootContext(optional?: false): TooltipRootContextValue
export function useTooltipRootContext(
  optional: true
): TooltipRootContextValue | undefined
export function useTooltipRootContext(
  optional = false
): TooltipRootContextValue | undefined {
  const context = useContext(TooltipRootContext)
  if (context == null && !optional) {
    throw new Error('Base UI: Tooltip parts must be used within <Tooltip.Root>.')
  }
  return context
}

/**
 * Context value published by {@link TooltipRoot}.
 */
export interface TooltipRootContextValue {
  open: Accessor<boolean>
  openAssign: (next: boolean) => void
  setOpen: (
    next: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
  disabled: Accessor<boolean>
  disableHoverablePopup: Accessor<boolean>
  trackCursorAxis: Accessor<TooltipTrackCursorAxis>
  cursorPoint: Accessor<{ x: number; y: number } | null>
  cursorPointAssign: Setter<{ x: number; y: number } | null>
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
  arrowElement: Accessor<HTMLElement | null>
  arrowElementAssign: Setter<HTMLElement | null>
  portalId: Accessor<string>
  preventUnmountOnClose: Accessor<boolean>
  preventUnmountOnCloseAssign: Setter<boolean>
  openChangeReason: Accessor<ChangeEventReason | null>
  instantType: Accessor<string | undefined>
  openDelay: Accessor<number>
  openDelayAssign: Setter<number>
  closeDelay: Accessor<number>
  closeDelayAssign: Setter<number>
  closeOnClick: Accessor<boolean>
  closeOnClickAssign: Setter<boolean>
  /** Schedules a hover-out close after `closeDelay()`, canceling any pending one. */
  scheduleClose: (event?: Event) => void
  /** Cancels a pending {@link scheduleClose} timer, e.g. re-entering the popup. */
  cancelScheduledClose: () => void
  onOpenChangeComplete?: (open: boolean) => void
}

/**
 * `Tooltip.Root` `trackCursorAxis` — which axis (if any) follows the pointer.
 */
export type TooltipTrackCursorAxis = 'none' | 'x' | 'y' | 'both'
