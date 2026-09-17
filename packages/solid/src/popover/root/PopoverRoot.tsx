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
import { createFocusTrap } from '../../internals/focusTrap'
import { listenerEffect } from '../../internals/listenerEffect'
import { createScrollLock } from '../../internals/scrollLock'
import { PATIENT_CLICK_THRESHOLD } from '../utils/constants'

import { PopoverRootContext, usePopoverRootContext } from './PopoverRootContext'

import type { PopoverRootContextValue } from './PopoverRootContext'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of the popover.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 *
 * @param componentProps - Root props (`open`, `defaultOpen`, `modal`, …).
 * @returns A Solid JSX fragment wrapping children in context.
 *
 * @example
 * ```tsx
 * import { Popover } from "@script-augur/base-ui-solid/popover"
 *
 * <Popover.Root>
 *   <Popover.Trigger>Open</Popover.Trigger>
 *   <Popover.Portal>
 *     <Popover.Positioner>
 *       <Popover.Popup>
 *         <Popover.Title>Title</Popover.Title>
 *         <Popover.Close>Close</Popover.Close>
 *       </Popover.Popup>
 *     </Popover.Positioner>
 *   </Popover.Portal>
 * </Popover.Root>
 * ```
 */
export function PopoverRoot(componentProps: PopoverRootProps): JSX.Element {
  const [local] = splitProps(componentProps, [
    'children',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onOpenChangeComplete',
    'modal',
    'actionsRef',
  ])

  const parentContext = usePopoverRootContext(true)
  const nested = () => parentContext != null

  const [open, openAssign] = createControlled({
    value: () => local.open,
    defaultValue: local.defaultOpen ?? false,
  })

  const modal = () => local.modal ?? false

  const { mounted, mountedAssign, transitionStatus } =
    createTransitionStatus(open)

  const [titleElementId, titleElementIdAssign] = createSignal<
    string | undefined
  >()
  const [descriptionElementId, descriptionElementIdAssign] = createSignal<
    string | undefined
  >()
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
  const [internalBackdropElement, internalBackdropElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [arrowElement, arrowElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [ownNestedOpenPopovers, ownNestedOpenPopoversAssign] = createSignal(0)
  const [preventUnmountOnClose, preventUnmountOnCloseAssign] =
    createSignal(false)
  const [popupInitialFocus, popupInitialFocusAssign] = createSignal<
    boolean | HTMLElement | null | undefined
  >(undefined)
  const [popupFinalFocus, popupFinalFocusAssign] = createSignal<
    boolean | HTMLElement | null | undefined
  >(undefined)
  const [openChangeReason, openChangeReasonAssign] =
    createSignal<ChangeEventReason | null>(null)
  const [instantType, instantTypeAssign] = createSignal<string | undefined>()
  const [stickIfOpen, stickIfOpenAssign] = createSignal(true)
  const [closePartCount, closePartCountAssign] = createSignal(0)
  const [openOnHover, openOnHoverAssign] = createSignal(false)
  const [hoverDelay, hoverDelayAssign] = createSignal(0)
  const [hoverCloseDelay, hoverCloseDelayAssign] = createSignal(0)

  let stickIfOpenTimeout: ReturnType<typeof setTimeout> | undefined

  const portalId = generateId('base-ui-popover-portal')

  const isTopmost = () => ownNestedOpenPopovers() === 0

  const hasClosePart = () => closePartCount() > 0

  const setOpen = (
    nextOpen: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => {
    const details = eventDetails as PopoverRootChangeEventDetails
    details.preventUnmountOnClose = () => {
      preventUnmountOnCloseAssign(true)
    }
    local.onOpenChange?.(nextOpen, details)
    if (eventDetails.isCanceled) return

    const reason = eventDetails.reason
    const isHover = reason === REASONS.triggerHover
    const isKeyboardClick =
      reason === REASONS.triggerPress &&
      eventDetails.event instanceof MouseEvent &&
      eventDetails.event.detail === 0
    const isDismissClose =
      !nextOpen && (reason === REASONS.escapeKey || reason === REASONS.none)

    if (isHover && nextOpen) {
      stickIfOpenAssign(true)
      if (stickIfOpenTimeout) clearTimeout(stickIfOpenTimeout)
      stickIfOpenTimeout = setTimeout(() => {
        stickIfOpenAssign(false)
      }, PATIENT_CLICK_THRESHOLD)
    }

    openAssign(nextOpen)
    if (nextOpen) {
      openChangeReasonAssign(reason)
    }

    if (isKeyboardClick || isDismissClose) {
      instantTypeAssign(isKeyboardClick ? 'click' : 'dismiss')
    } else {
      instantTypeAssign(undefined)
    }
  }

  const handleUnmount = () => {
    mountedAssign(false)
    stickIfOpenAssign(true)
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

  createEffect(() => {
    if (!open() && stickIfOpenTimeout) {
      clearTimeout(stickIfOpenTimeout)
      stickIfOpenTimeout = undefined
    }
  })

  onCleanup(() => {
    if (stickIfOpenTimeout) clearTimeout(stickIfOpenTimeout)
  })

  // Nested open/close notification to parent.
  createEffect(() => {
    if (!parentContext) return
    if (open()) {
      parentContext.onNestedPopoverOpen(ownNestedOpenPopovers())
    } else {
      parentContext.onNestedPopoverClose()
    }
    onCleanup(() => {
      if (open()) {
        parentContext.onNestedPopoverClose()
      }
    })
  })

  // Scroll lock when modal === true (not for hover-opened popovers).
  createScrollLock(
    () =>
      open() &&
      modal() === true &&
      mounted() &&
      openChangeReason() !== REASONS.triggerHover
  )

  // Focus trap: modal true only when a Close part is present; trap-focus always.
  createFocusTrap({
    enabled: () => {
      if (!open() || !mounted() || !isTopmost()) return false
      if (openChangeReason() === REASONS.triggerHover) return false
      const mode = modal()
      if (mode === 'trap-focus') return true
      if (mode === true) return hasClosePart()
      return false
    },
    container: popupElement,
    initialFocus: () => {
      const value = popupInitialFocus()
      if (value === false) return false
      if (value instanceof HTMLElement) return value
      return undefined
    },
    restoreFocus: () => {
      const value = popupFinalFocus()
      if (value === false) return false
      if (value instanceof HTMLElement) return value
      return triggerElement()
    },
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

  // Outside pointer dismiss with backdrop-aware modal rules.
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

      const modalMode = modal()
      if (modalMode === true) {
        const internalBackdrop = internalBackdropElement()
        const backdrop = backdropElement()
        const onBackdrop =
          (internalBackdrop != null &&
            (target === internalBackdrop ||
              contains(internalBackdrop, target))) ||
          (backdrop != null &&
            (target === backdrop || contains(backdrop, target)))
        if ((internalBackdrop != null || backdrop != null) && !onBackdrop) {
          return
        }
      }

      setOpen(false, createChangeEventDetails(REASONS.outsidePress, event))
    },
    true
  )

  const contextValue: PopoverRootContextValue = {
    open,
    openAssign,
    setOpen,
    modal,
    nested,
    nestedOpenPopoverCount: ownNestedOpenPopovers,
    onNestedPopoverOpen: (ownChildrenCount: number) => {
      ownNestedOpenPopoversAssign(ownChildrenCount + 1)
    },
    onNestedPopoverClose: () => {
      ownNestedOpenPopoversAssign(0)
    },
    mounted,
    mountedAssign,
    transitionStatus,
    titleElementId,
    titleElementIdAssign,
    descriptionElementId,
    descriptionElementIdAssign,
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
    internalBackdropElement,
    internalBackdropElementAssign,
    arrowElement,
    arrowElementAssign,
    portalId: () => portalId,
    preventUnmountOnClose,
    preventUnmountOnCloseAssign,
    popupInitialFocus,
    popupInitialFocusAssign,
    popupFinalFocus,
    popupFinalFocusAssign,
    openChangeReason,
    instantType,
    stickIfOpen,
    hasClosePart,
    registerClosePart: () => closePartCountAssign(c => c + 1),
    unregisterClosePart: () => closePartCountAssign(c => Math.max(0, c - 1)),
    openOnHover,
    openOnHoverAssign,
    hoverDelay,
    hoverDelayAssign,
    hoverCloseDelay,
    hoverCloseDelayAssign,
    onOpenChangeComplete: local.onOpenChangeComplete,
  }

  return (
    <PopoverRootContext.Provider value={contextValue}>
      {local.children}
    </PopoverRootContext.Provider>
  )
}

/**
 * Props for {@link PopoverRoot}.
 */
export type PopoverRootProps = {
  children?: JSX.Element
  /** Whether the popover is currently open. */
  open?: boolean
  /**
   * Whether the popover is initially open.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Determines if the popover enters a modal state when open.
   * - `true`: user interaction is limited to the popover (scroll lock + outside pointer block). Focus trap requires a Close part.
   * - `false`: free interaction with the page
   * - `'trap-focus'`: focus trap without scroll lock / pointer block
   * @default false
   */
  modal?: boolean | 'trap-focus'
  /** Called when the popover should open or close. */
  onOpenChange?: (
    open: boolean,
    eventDetails: PopoverRootChangeEventDetails
  ) => void
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void
  /**
   * Imperative actions (`unmount`, `close`).
   */
  actionsRef?: PopoverRootActions
  /**
   * ID of the trigger associated with a controlled popover.
   * Detached-trigger / handle wiring is deferred — see UPSTREAM_TEST_PARITY.md.
   */
  triggerId?: string | null
  /**
   * Default trigger id for an initially open uncontrolled popover.
   * Detached-trigger / handle wiring is deferred.
   */
  defaultTriggerId?: string | null
  /**
   * Handle for detached triggers. Deferred — see UPSTREAM_TEST_PARITY.md.
   */
  handle?: unknown
}

/** Imperative actions exposed via `actionsRef`. */
export type PopoverRootActions = {
  unmount: () => void
  close: () => void
}

/** Change-event reason for Popover. */
export type PopoverRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.triggerHover
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/** Change-event details for Popover. */
export type PopoverRootChangeEventDetails =
  BaseUIChangeEventDetails<PopoverRootChangeEventReason> & {
    preventUnmountOnClose?: () => void
  }
