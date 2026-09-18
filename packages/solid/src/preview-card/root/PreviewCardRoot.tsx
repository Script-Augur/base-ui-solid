import { contains, generateId, getTarget } from '@script-augur/base-ui-utils'
import { createEffect, createSignal, onCleanup, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { createDismiss } from '../../internals/dismiss'
import { listenerEffect } from '../../internals/listenerEffect'
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants'

import {
  PreviewCardRootContext,
  usePreviewCardRootContext,
} from './PreviewCardRootContext'

import type { PreviewCardRootContextValue } from './PreviewCardRootContext'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of the preview card.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 *
 * @param componentProps - Root props (`open`, `defaultOpen`, …).
 * @returns A Solid JSX fragment wrapping children in context.
 *
 * @example
 * ```tsx
 * import { PreviewCard } from "@script-augur/base-ui-solid/preview-card"
 *
 * <PreviewCard.Root>
 *   <PreviewCard.Trigger href="https://example.com">Link</PreviewCard.Trigger>
 *   <PreviewCard.Portal>
 *     <PreviewCard.Positioner>
 *       <PreviewCard.Popup>Preview</PreviewCard.Popup>
 *     </PreviewCard.Positioner>
 *   </PreviewCard.Portal>
 * </PreviewCard.Root>
 * ```
 */
export function PreviewCardRoot(
  componentProps: PreviewCardRootProps
): JSX.Element {
  const [local] = splitProps(componentProps, [
    'children',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onOpenChangeComplete',
    'actionsRef',
  ])

  const parentContext = usePreviewCardRootContext(true)
  const nested = () => parentContext != null

  const [open, openAssign] = createControlled({
    value: () => local.open,
    defaultValue: local.defaultOpen ?? false,
  })

  const { mounted, mountedAssign, transitionStatus } =
    createTransitionStatus(open)

  const [popupElement, popupElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [positionerElement, positionerElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [viewportElement, viewportElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [triggerElement, triggerElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [backdropElement, backdropElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [arrowElement, arrowElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [ownNestedOpenPreviewCards, ownNestedOpenPreviewCardsAssign] =
    createSignal(0)
  const [preventUnmountOnClose, preventUnmountOnCloseAssign] =
    createSignal(false)
  const [openChangeReason, openChangeReasonAssign] =
    createSignal<ChangeEventReason | null>(null)
  const [instantType, instantTypeAssign] = createSignal<string | undefined>()
  const [hoverDelay, hoverDelayAssign] = createSignal(OPEN_DELAY)
  const [hoverCloseDelay, hoverCloseDelayAssign] = createSignal(CLOSE_DELAY)

  let openTimeout: ReturnType<typeof setTimeout> | undefined
  let closeTimeout: ReturnType<typeof setTimeout> | undefined

  const portalId = generateId('base-ui-preview-card-portal')

  const isTopmost = () => ownNestedOpenPreviewCards() === 0

  const clearHoverTimers = () => {
    if (openTimeout) {
      clearTimeout(openTimeout)
      openTimeout = undefined
    }
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      closeTimeout = undefined
    }
  }

  const setOpen = (
    nextOpen: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => {
    const details = eventDetails as PreviewCardRootChangeEventDetails
    details.preventUnmountOnClose = () => {
      preventUnmountOnCloseAssign(true)
    }
    local.onOpenChange?.(nextOpen, details)
    if (eventDetails.isCanceled) return

    const reason = eventDetails.reason
    const isFocusOpen = nextOpen && reason === REASONS.triggerFocus
    const isDismissClose =
      !nextOpen &&
      (reason === REASONS.escapeKey ||
        reason === REASONS.outsidePress ||
        reason === REASONS.none)

    clearHoverTimers()
    openAssign(nextOpen)
    if (nextOpen) {
      openChangeReasonAssign(reason)
    }

    if (isFocusOpen || isDismissClose) {
      instantTypeAssign(isFocusOpen ? 'focus' : 'dismiss')
    } else {
      instantTypeAssign(undefined)
    }
  }

  const scheduleOpen = (reason: ChangeEventReason, event?: Event) => {
    clearHoverTimers()
    openTimeout = setTimeout(() => {
      if (!open()) {
        setOpen(true, createChangeEventDetails(reason, event))
      }
    }, hoverDelay())
  }

  const scheduleClose = (reason: ChangeEventReason, event?: Event) => {
    clearHoverTimers()
    closeTimeout = setTimeout(() => {
      if (open()) {
        setOpen(false, createChangeEventDetails(reason, event))
      }
    }, hoverCloseDelay())
  }

  const onPopupPointerEnter = () => {
    clearHoverTimers()
  }

  const onPopupPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    scheduleClose(REASONS.triggerHover, event)
  }

  const handleUnmount = () => {
    mountedAssign(false)
    openChangeReasonAssign(null)
    local.onOpenChangeComplete?.(false)
  }

  createOpenChangeComplete({
    open,
    element: popupElement,
    enabled: () => !preventUnmountOnClose(),
    onComplete() {
      if (!open()) {
        handleUnmount()
      } else {
        local.onOpenChangeComplete?.(true)
      }
    },
  })

  createEffect(() => {
    const actions = local.actionsRef
    if (!actions) return
    actions.unmount = handleUnmount
    actions.close = () => {
      setOpen(false, createChangeEventDetails(REASONS.imperativeAction))
    }
  })

  onCleanup(clearHoverTimers)

  // Nested open/close notification to parent.
  createEffect(() => {
    if (!parentContext) return
    if (open()) {
      parentContext.onNestedPreviewCardOpen(ownNestedOpenPreviewCards())
    } else {
      parentContext.onNestedPreviewCardClose()
    }
    onCleanup(() => {
      if (open()) {
        parentContext.onNestedPreviewCardClose()
      }
    })
  })

  // Escape dismiss (topmost only).
  createDismiss({
    enabled: () => open() && mounted() && isTopmost(),
    refs: () => [popupElement(), positionerElement(), viewportElement()],
    onDismiss: event => {
      setOpen(false, createChangeEventDetails(REASONS.escapeKey, event))
    },
    escapeKey: true,
    outsidePress: false,
  })

  // Outside pointer dismiss.
  listenerEffect(
    () => {
      if (!open() || !mounted() || !isTopmost()) return null
      return document
    },
    'pointerdown',
    event => {
      if ('button' in event && event.button !== 0) {
        return
      }
      const target = getTarget(event) as Element | null
      if (!target) return

      const popup = popupElement()
      if (popup && contains(popup, target)) return
      const positioner = positionerElement()
      if (positioner && contains(positioner, target)) return

      const trigger = triggerElement()
      if (trigger && contains(trigger, target)) return

      setOpen(false, createChangeEventDetails(REASONS.outsidePress, event))
    },
    true
  )

  const contextValue: PreviewCardRootContextValue = {
    open,
    openAssign,
    setOpen,
    nested,
    nestedOpenPreviewCardCount: ownNestedOpenPreviewCards,
    onNestedPreviewCardOpen: (ownChildrenCount: number) => {
      ownNestedOpenPreviewCardsAssign(ownChildrenCount + 1)
    },
    onNestedPreviewCardClose: () => {
      ownNestedOpenPreviewCardsAssign(0)
    },
    mounted,
    mountedAssign,
    transitionStatus,
    popupElement,
    popupElementAssign,
    positionerElement,
    positionerElementAssign,
    viewportElement,
    viewportElementAssign,
    triggerElement,
    triggerElementAssign,
    backdropElement,
    backdropElementAssign,
    arrowElement,
    arrowElementAssign,
    portalId: () => portalId,
    preventUnmountOnClose,
    preventUnmountOnCloseAssign,
    openChangeReason,
    instantType,
    hoverDelay,
    hoverDelayAssign,
    hoverCloseDelay,
    hoverCloseDelayAssign,
    clearHoverTimers,
    scheduleOpen,
    scheduleClose,
    onPopupPointerEnter,
    onPopupPointerLeave,
    onOpenChangeComplete: local.onOpenChangeComplete,
  }

  return (
    <PreviewCardRootContext.Provider value={contextValue}>
      {local.children}
    </PreviewCardRootContext.Provider>
  )
}

/**
 * Props for {@link PreviewCardRoot}.
 */
export type PreviewCardRootProps = {
  children?: JSX.Element
  /** Whether the preview card is currently open. */
  open?: boolean
  /**
   * Whether the preview card is initially open.
   * @default false
   */
  defaultOpen?: boolean
  /** Called when the preview card should open or close. */
  onOpenChange?: (
    open: boolean,
    eventDetails: PreviewCardRootChangeEventDetails
  ) => void
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void
  /**
   * Imperative actions (`unmount`, `close`).
   */
  actionsRef?: PreviewCardRootActions
  /**
   * ID of the trigger associated with a controlled preview card.
   * Detached-trigger / handle wiring is deferred — see UPSTREAM_TEST_PARITY.md.
   */
  triggerId?: string | null
  /**
   * Default trigger id for an initially open uncontrolled preview card.
   * Detached-trigger / handle wiring is deferred.
   */
  defaultTriggerId?: string | null
  /**
   * Handle for detached triggers. Deferred — see UPSTREAM_TEST_PARITY.md.
   */
  handle?: unknown
}

/** Imperative actions exposed via `actionsRef`. */
export type PreviewCardRootActions = {
  unmount: () => void
  close: () => void
}

/** Change-event reason for Preview Card. */
export type PreviewCardRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/** Change-event details for Preview Card. */
export type PreviewCardRootChangeEventDetails =
  BaseUIChangeEventDetails<PreviewCardRootChangeEventReason> & {
    preventUnmountOnClose?: () => void
  }
