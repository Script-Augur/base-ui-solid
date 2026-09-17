import { generateId } from '@script-augur/base-ui-utils'
import { createEffect, createSignal, onCleanup, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { createDismiss } from '../../internals/dismiss'
import { useTooltipProviderContext } from '../provider/TooltipProviderContext'

import { TooltipRootContext } from './TooltipRootContext'

import type {
  TooltipRootContextValue,
  TooltipTrackCursorAxis,
} from './TooltipRootContext'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of the tooltip.
 * Doesn't render its own HTML element.
 *
 * Lite: no modal state, scroll lock, or focus trap — tooltips never take
 * focus/interaction ownership the way dialogs/popovers do. Escape and
 * outside-press always dismiss (no backdrop rules).
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 *
 * @param componentProps - Root props (`open`, `defaultOpen`, `disabled`, …).
 * @returns A Solid JSX fragment wrapping children in context.
 *
 * @example
 * ```tsx
 * import { Tooltip } from "@script-augur/base-ui-solid/tooltip"
 *
 * <Tooltip.Root>
 *   <Tooltip.Trigger>Hover me</Tooltip.Trigger>
 *   <Tooltip.Portal>
 *     <Tooltip.Positioner>
 *       <Tooltip.Popup>Helpful text</Tooltip.Popup>
 *     </Tooltip.Positioner>
 *   </Tooltip.Portal>
 * </Tooltip.Root>
 * ```
 */
export function TooltipRoot(componentProps: TooltipRootProps): JSX.Element {
  const [local] = splitProps(componentProps, [
    'children',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onOpenChangeComplete',
    'disableHoverablePopup',
    'trackCursorAxis',
    'actionsRef',
    'disabled',
  ])

  const providerContext = useTooltipProviderContext(true)

  const [open, openAssign] = createControlled({
    value: () => local.open,
    defaultValue: local.defaultOpen ?? false,
  })

  const disabled = () => local.disabled ?? false
  const disableHoverablePopup = () => local.disableHoverablePopup ?? false
  const trackCursorAxis = (): TooltipTrackCursorAxis =>
    local.trackCursorAxis ?? 'none'

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
  const [arrowElement, arrowElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [cursorPoint, cursorPointAssign] = createSignal<{
    x: number
    y: number
  } | null>(null)
  const [preventUnmountOnClose, preventUnmountOnCloseAssign] =
    createSignal(false)
  const [openChangeReason, openChangeReasonAssign] =
    createSignal<ChangeEventReason | null>(null)
  const [instantType, instantTypeAssign] = createSignal<string | undefined>()
  const [openDelay, openDelayAssign] = createSignal(0)
  const [closeDelay, closeDelayAssign] = createSignal(0)
  const [closeOnClick, closeOnClickAssign] = createSignal(true)

  const portalId = generateId('base-ui-tooltip-portal')

  const setOpen = (
    nextOpen: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => {
    const details = eventDetails as TooltipRootChangeEventDetails
    details.preventUnmountOnClose = () => {
      preventUnmountOnCloseAssign(true)
    }
    local.onOpenChange?.(nextOpen, details)
    if (eventDetails.isCanceled) return

    const reason = eventDetails.reason

    if (nextOpen) {
      if (reason === REASONS.triggerFocus) {
        instantTypeAssign('focus')
      } else if (
        reason === REASONS.triggerHover &&
        (providerContext?.instantPhase() ?? false)
      ) {
        instantTypeAssign('delay')
      } else {
        instantTypeAssign(undefined)
      }
      providerContext?.notifyOpen()
    } else {
      if (
        reason === REASONS.escapeKey ||
        reason === REASONS.outsidePress ||
        reason === REASONS.none
      ) {
        instantTypeAssign('dismiss')
      } else {
        instantTypeAssign(undefined)
      }
      providerContext?.notifyClose()
    }

    openAssign(nextOpen)
    if (nextOpen) {
      openChangeReasonAssign(reason)
    }
  }

  let closeTimeout: ReturnType<typeof setTimeout> | undefined

  const cancelScheduledClose = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      closeTimeout = undefined
    }
  }

  const scheduleClose = (event?: Event) => {
    cancelScheduledClose()
    closeTimeout = setTimeout(() => {
      closeTimeout = undefined
      if (open() && openChangeReason() === REASONS.triggerHover) {
        setOpen(false, createChangeEventDetails(REASONS.triggerHover, event))
      }
    }, closeDelay())
  }

  onCleanup(cancelScheduledClose)

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

  // Forced close when Root becomes disabled while open.
  createEffect(() => {
    if (disabled() && open()) {
      setOpen(false, createChangeEventDetails(REASONS.disabled))
    }
  })

  // Escape + outside press dismiss (no modal/backdrop rules).
  createDismiss({
    enabled: () => open() && mounted(),
    refs: () => [
      popupElement(),
      positionerElement(),
      viewportElement(),
      triggerElement(),
    ],
    onDismiss: event => {
      const reason =
        event instanceof KeyboardEvent ? REASONS.escapeKey : REASONS.outsidePress
      setOpen(false, createChangeEventDetails(reason, event))
    },
    escapeKey: true,
    outsidePress: true,
  })

  const contextValue: TooltipRootContextValue = {
    open,
    openAssign,
    setOpen,
    disabled,
    disableHoverablePopup,
    trackCursorAxis,
    cursorPoint,
    cursorPointAssign,
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
    arrowElement,
    arrowElementAssign,
    portalId: () => portalId,
    preventUnmountOnClose,
    preventUnmountOnCloseAssign,
    openChangeReason,
    instantType,
    openDelay,
    openDelayAssign,
    closeDelay,
    closeDelayAssign,
    closeOnClick,
    closeOnClickAssign,
    scheduleClose,
    cancelScheduledClose,
    onOpenChangeComplete: local.onOpenChangeComplete,
  }

  return (
    <TooltipRootContext.Provider value={contextValue}>
      {local.children}
    </TooltipRootContext.Provider>
  )
}

/**
 * Props for {@link TooltipRoot}.
 */
export type TooltipRootProps = {
  children?: JSX.Element
  /** Whether the tooltip is currently open. */
  open?: boolean
  /**
   * Whether the tooltip is initially open.
   * @default false
   */
  defaultOpen?: boolean
  /** Called when the tooltip should open or close. */
  onOpenChange?: (
    open: boolean,
    eventDetails: TooltipRootChangeEventDetails
  ) => void
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void
  /**
   * Whether the popup remains open while the pointer is over it (not just
   * the trigger).
   * @default false
   */
  disableHoverablePopup?: boolean
  /**
   * Whether (and which axis) the popup should follow the pointer instead of
   * anchoring to the trigger.
   *
   * Lite: the cursor point is tracked on the context, but the positioner
   * still anchors to the trigger and goes inert on any axis other than
   * `'none'` — see `UPSTREAM_TEST_PARITY.md`.
   * @default 'none'
   */
  trackCursorAxis?: TooltipTrackCursorAxis
  /**
   * Imperative actions (`unmount`, `close`).
   */
  actionsRef?: TooltipRootActions
  /**
   * When `true`, the tooltip cannot open and closes if already open.
   * @default false
   */
  disabled?: boolean
  /**
   * ID of the trigger associated with a controlled tooltip.
   * Detached-trigger / handle wiring is deferred — see UPSTREAM_TEST_PARITY.md.
   */
  triggerId?: string | null
  /**
   * Default trigger id for an initially open uncontrolled tooltip.
   * Detached-trigger / handle wiring is deferred.
   */
  defaultTriggerId?: string | null
  /**
   * Handle for detached triggers. Deferred — see UPSTREAM_TEST_PARITY.md.
   */
  handle?: unknown
}

/** Imperative actions exposed via `actionsRef`. */
export type TooltipRootActions = {
  unmount: () => void
  close: () => void
}

/** Change-event reason for Tooltip. */
export type TooltipRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.disabled
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/** Change-event details for Tooltip. */
export type TooltipRootChangeEventDetails =
  BaseUIChangeEventDetails<TooltipRootChangeEventReason> & {
    preventUnmountOnClose?: () => void
  }

export type { TooltipTrackCursorAxis }
