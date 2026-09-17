import { createContext, useContext } from 'solid-js'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { Accessor, Setter } from 'solid-js'

/**
 * Shared Popover root state for compound parts.
 */
export const PopoverRootContext = createContext<PopoverRootContextValue>()

/**
 * Reads the nearest {@link PopoverRoot} context.
 *
 * @param optional - When `true`, returns `undefined` outside a root (nested detection).
 * @returns Context value, or `undefined` when `optional` and no provider.
 */
export function usePopoverRootContext(optional?: false): PopoverRootContextValue
export function usePopoverRootContext(
  optional: true
): PopoverRootContextValue | undefined
export function usePopoverRootContext(
  optional = false
): PopoverRootContextValue | undefined {
  const context = useContext(PopoverRootContext)
  if (context == null && !optional) {
    throw new Error(
      'Base UI: Popover parts must be used within <Popover.Root>.'
    )
  }
  return context
}

/**
 * Context value published by {@link PopoverRoot}.
 */
export interface PopoverRootContextValue {
  open: Accessor<boolean>
  openAssign: (next: boolean) => void
  setOpen: (
    next: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
  modal: Accessor<boolean | 'trap-focus'>
  nested: Accessor<boolean>
  nestedOpenPopoverCount: Accessor<number>
  onNestedPopoverOpen: (ownChildrenCount: number) => void
  onNestedPopoverClose: () => void
  mounted: Accessor<boolean>
  mountedAssign: Setter<boolean>
  transitionStatus: Accessor<TransitionStatus>
  titleElementId: Accessor<string | undefined>
  titleElementIdAssign: Setter<string | undefined>
  descriptionElementId: Accessor<string | undefined>
  descriptionElementIdAssign: Setter<string | undefined>
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
  popupInitialFocus: Accessor<boolean | HTMLElement | null | undefined>
  popupInitialFocusAssign: Setter<boolean | HTMLElement | null | undefined>
  popupFinalFocus: Accessor<boolean | HTMLElement | null | undefined>
  popupFinalFocusAssign: Setter<boolean | HTMLElement | null | undefined>
  openChangeReason: Accessor<ChangeEventReason | null>
  instantType: Accessor<string | undefined>
  stickIfOpen: Accessor<boolean>
  hasClosePart: Accessor<boolean>
  registerClosePart: () => void
  unregisterClosePart: () => void
  openOnHover: Accessor<boolean>
  openOnHoverAssign: Setter<boolean>
  hoverDelay: Accessor<number>
  hoverDelayAssign: Setter<number>
  hoverCloseDelay: Accessor<number>
  hoverCloseDelayAssign: Setter<number>
  onOpenChangeComplete?: (open: boolean) => void
}
