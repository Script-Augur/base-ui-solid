import { createContext, useContext } from 'solid-js'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { Accessor, Setter } from 'solid-js'

/**
 * Shared Preview Card root state for compound parts.
 */
export const PreviewCardRootContext =
  createContext<PreviewCardRootContextValue>()

/**
 * Reads the nearest {@link PreviewCardRoot} context.
 *
 * @param optional - When `true`, returns `undefined` outside a root (nested detection).
 * @returns Context value, or `undefined` when `optional` and no provider.
 */
export function usePreviewCardRootContext(
  optional?: false
): PreviewCardRootContextValue
export function usePreviewCardRootContext(
  optional: true
): PreviewCardRootContextValue | undefined
export function usePreviewCardRootContext(
  optional = false
): PreviewCardRootContextValue | undefined {
  const context = useContext(PreviewCardRootContext)
  if (context == null && !optional) {
    throw new Error(
      'Base UI: PreviewCard parts must be used within <PreviewCard.Root>.'
    )
  }
  return context
}

/**
 * Context value published by {@link PreviewCardRoot}.
 */
export interface PreviewCardRootContextValue {
  open: Accessor<boolean>
  openAssign: (next: boolean) => void
  setOpen: (
    next: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
  nested: Accessor<boolean>
  nestedOpenPreviewCardCount: Accessor<number>
  onNestedPreviewCardOpen: (ownChildrenCount: number) => void
  onNestedPreviewCardClose: () => void
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
  arrowElement: Accessor<HTMLElement | null>
  arrowElementAssign: Setter<HTMLElement | null>
  portalId: Accessor<string>
  preventUnmountOnClose: Accessor<boolean>
  preventUnmountOnCloseAssign: Setter<boolean>
  openChangeReason: Accessor<ChangeEventReason | null>
  instantType: Accessor<string | undefined>
  hoverDelay: Accessor<number>
  hoverDelayAssign: Setter<number>
  hoverCloseDelay: Accessor<number>
  hoverCloseDelayAssign: Setter<number>
  clearHoverTimers: () => void
  scheduleOpen: (reason: ChangeEventReason, event?: Event) => void
  scheduleClose: (reason: ChangeEventReason, event?: Event) => void
  onPopupPointerEnter: () => void
  onPopupPointerLeave: (event: PointerEvent) => void
  onOpenChangeComplete?: (open: boolean) => void
}
