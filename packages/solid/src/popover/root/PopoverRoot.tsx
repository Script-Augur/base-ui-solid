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
import {
  createActiveTriggerElementSync,
  createImplicitActiveTrigger,
  createPopupHandleAttachment,
  isEventOnPopupTrigger,
  setPopupOpenState,
} from '../../internals/popups'
import { createScrollLock } from '../../internals/scrollLock'
import { PopoverStore } from '../store/PopoverStore'
import { PATIENT_CLICK_THRESHOLD } from '../utils/constants'

import { PopoverRootContext, usePopoverRootContext } from './PopoverRootContext'

import type { PopoverRootContextValue } from './PopoverRootContext'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { PayloadChildRenderFunction } from '../../internals/popups'
import type { PopoverHandle } from '../store/PopoverHandle'
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
export function PopoverRoot<TPayload = unknown>(
  componentProps: PopoverRootProps<TPayload>
): JSX.Element {
  const [local] = splitProps(componentProps, [
    'children',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onOpenChangeComplete',
    'modal',
    'actionsRef',
    'handle',
    'triggerId',
    'defaultTriggerId',
  ])

  const parentContext = usePopoverRootContext(true)
  const nested = () => parentContext != null

  const [open, openAssign] = createControlled({
    value: () => local.open,
    defaultValue: local.defaultOpen ?? false,
  })

  const modal = () => local.modal ?? false

  const store = new PopoverStore<TPayload>({
    open: local.defaultOpen ?? false,
    openProp: local.open,
    activeTriggerId: local.defaultTriggerId ?? null,
    triggerIdProp: local.triggerId,
    modal: modal(),
  })

  createPopupHandleAttachment(local.handle, store)
  createImplicitActiveTrigger(store)

  // Open pipeline (Dialog/Popover hybrid — see internals/popups/OPEN_PIPELINE.md):
  // `createControlled` owns UI `open`; Root `setOpen` is the only writer. Handle /
  // detached triggers call `store.setOpen`, which Root overwrites below so both
  // paths share one pipeline. Menu must NOT copy this overwrite — use store +
  // floating `setOpen` dispatch instead.

  createEffect(() => {
    store.set('openProp', local.open)
  })
  createEffect(() => {
    store.set('triggerIdProp', local.triggerId)
  })
  createEffect(() => {
    store.set('modal', modal())
  })
  createEffect(() => {
    store.context.onOpenChange = local.onOpenChange as
      | ((
          open: boolean,
          eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
        ) => void)
      | undefined
    store.context.onOpenChangeComplete = local.onOpenChangeComplete
  })
  onCleanup(() => store.dispose())

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
  createActiveTriggerElementSync(store, triggerElementAssign)
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
      store.set('preventUnmountingOnClose', true)
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

    const updatedState = {
      open: nextOpen,
      openChangeReason: reason,
      stickIfOpen: stickIfOpen(),
      instantType: instantType(),
    }
    setPopupOpenState(updatedState, nextOpen, details.trigger)
    store.update(updatedState)
  }

  store.setOpen = setOpen

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

      if (
        isEventOnPopupTrigger(
          store.context.triggerElements,
          target,
          triggerElement()
        )
      ) {
        return
      }

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

  createEffect(() => {
    store.set('popupElement', popupElement())
    store.context.popupRef.current = popupElement()
  })
  createEffect(() => {
    store.set('positionerElement', positionerElement())
  })
  createEffect(() => {
    store.set('mounted', mounted())
  })
  createEffect(() => {
    store.set('stickIfOpen', stickIfOpen())
  })
  createEffect(() => {
    store.set('openChangeReason', openChangeReason())
  })
  createEffect(() => {
    store.set('instantType', instantType())
  })
  createEffect(() => {
    store.set('openOnHover', openOnHover())
  })
  createEffect(() => {
    store.set('closeDelay', hoverCloseDelay())
  })
  createEffect(() => {
    if (store.state.open !== open()) {
      store.set('open', open())
    }
  })

  const contextValue: PopoverRootContextValue = {
    open,
    openAssign,
    setOpen,
    store: store as PopoverStore,
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

  const payload = store.useState('payload')

  return (
    <PopoverRootContext.Provider value={contextValue}>
      {(() => {
        // Read children once, and only under the Provider — Solid may expose
        // `children` as a getter that creates the tree on access.
        const resolvedChildren = local.children
        if (typeof resolvedChildren === 'function') {
          return (
            resolvedChildren as PayloadChildRenderFunction<unknown>
          )({
            payload: payload(),
          })
        }
        return resolvedChildren
      })()}
    </PopoverRootContext.Provider>
  )
}

/**
 * Props for {@link PopoverRoot}.
 *
 * @typeParam TPayload - Optional payload type from `createHandle` / trigger `payload`.
 */
export type PopoverRootProps<TPayload = unknown> = {
  /**
   * Popover contents. May be a render function that receives the active
   * trigger's `payload`.
   *
   * Typed as {@link JSX.Element} so Solid's JSX transform does not wrap normal
   * element children; {@link PayloadChildRenderFunction} is supported at
   * runtime (and via assertion) matching `@base-ui/react`.
   */
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
   */
  triggerId?: string | null
  /**
   * Default trigger id for an initially open uncontrolled popover.
   * @default null
   */
  defaultTriggerId?: string | null
  /**
   * A handle to associate detached `Popover.Trigger` components with this root.
   */
  handle?: PopoverHandle<TPayload>
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
