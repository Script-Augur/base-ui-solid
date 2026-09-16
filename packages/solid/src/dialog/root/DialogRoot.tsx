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

import { DialogRootContext, useDialogRootContext } from './DialogRootContext'

import type { DialogRootContextValue } from './DialogRootContext'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of the dialog.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Root props (`open`, `defaultOpen`, `modal`, …).
 * @returns A Solid JSX fragment wrapping children in context.
 *
 * @example
 * ```tsx
 * import { Dialog } from "@script-augur/base-ui-solid/dialog"
 *
 * <Dialog.Root>
 *   <Dialog.Trigger>Open</Dialog.Trigger>
 *   <Dialog.Portal>
 *     <Dialog.Backdrop />
 *     <Dialog.Popup>
 *       <Dialog.Title>Title</Dialog.Title>
 *       <Dialog.Close>Close</Dialog.Close>
 *     </Dialog.Popup>
 *   </Dialog.Portal>
 * </Dialog.Root>
 * ```
 */
export function DialogRoot(componentProps: DialogRootProps): JSX.Element {
  const [local] = splitProps(componentProps, [
    'children',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onOpenChangeComplete',
    'modal',
    'disablePointerDismissal',
    'actionsRef',
  ])

  const parentContext = useDialogRootContext(true)
  const nested = () => parentContext != null

  const [open, openAssign] = createControlled({
    value: () => local.open,
    defaultValue: local.defaultOpen ?? false,
  })

  const modal = () => local.modal ?? true
  const disablePointerDismissal = () => local.disablePointerDismissal ?? false

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
  const [viewportElement, viewportElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [triggerElement, triggerElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [backdropElement, backdropElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [internalBackdropElement, internalBackdropElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [ownNestedOpenDialogs, ownNestedOpenDialogsAssign] = createSignal(0)
  const [preventUnmountOnClose, preventUnmountOnCloseAssign] =
    createSignal(false)

  const portalId = generateId('base-ui-dialog-portal')

  const isTopmost = () => ownNestedOpenDialogs() === 0

  const setOpen = (
    nextOpen: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => {
    local.onOpenChange?.(nextOpen, eventDetails as DialogRootChangeEventDetails)
    if (eventDetails.isCanceled) return
    openAssign(nextOpen)
  }

  const handleUnmount = () => {
    mountedAssign(false)
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

  // Nested open/close notification to parent.
  createEffect(() => {
    if (!parentContext) return
    if (open()) {
      parentContext.onNestedDialogOpen(ownNestedOpenDialogs())
    } else {
      parentContext.onNestedDialogClose()
    }
    onCleanup(() => {
      if (open()) {
        parentContext.onNestedDialogClose()
      }
    })
  })

  createScrollLock(() => open() && modal() === true && mounted())

  createFocusTrap({
    enabled: () =>
      Boolean(open() && mounted() && modal() !== false && isTopmost()),
    container: popupElement,
    restoreFocus: triggerElement,
  })

  // Escape dismiss (topmost only).
  createDismiss({
    enabled: () => open() && mounted() && isTopmost(),
    refs: () => [popupElement(), viewportElement()],
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
      if (disablePointerDismissal()) return null
      return document
    },
    'pointerdown',
    event => {
      // Prefer left-button presses; treat missing `button` (some synthetic
      // events) as a primary press.
      if ('button' in event && event.button !== 0) {
        return
      }
      const target = getTarget(event) as Element | null
      if (!target) return

      const popup = popupElement()
      if (popup && contains(popup, target)) return

      const modalMode = modal()
      if (modalMode) {
        const internalBackdrop = internalBackdropElement()
        const backdrop = backdropElement()
        const onBackdrop =
          (internalBackdrop != null &&
            (target === internalBackdrop ||
              contains(internalBackdrop, target))) ||
          (backdrop != null &&
            (target === backdrop || contains(backdrop, target)))
        // When a backdrop exists, only dismiss from that surface (supports
        // sibling modal dialogs). Without a backdrop, any outside press closes.
        if ((internalBackdrop != null || backdrop != null) && !onBackdrop) {
          return
        }
      }

      setOpen(false, createChangeEventDetails(REASONS.outsidePress, event))
    },
    true
  )

  const contextValue: DialogRootContextValue = {
    open,
    openAssign,
    setOpen,
    modal,
    disablePointerDismissal,
    nested,
    nestedOpenDialogCount: ownNestedOpenDialogs,
    onNestedDialogOpen: (ownChildrenCount: number) => {
      ownNestedOpenDialogsAssign(ownChildrenCount + 1)
    },
    onNestedDialogClose: () => {
      ownNestedOpenDialogsAssign(0)
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
    viewportElement,
    viewportElementAssign,
    triggerElement,
    triggerElementAssign,
    backdropElement,
    backdropElementAssign,
    internalBackdropElement,
    internalBackdropElementAssign,
    portalId: () => portalId,
    preventUnmountOnClose,
    preventUnmountOnCloseAssign,
    onOpenChangeComplete: local.onOpenChangeComplete,
    role: 'dialog',
  }

  return (
    <DialogRootContext.Provider value={contextValue}>
      {local.children}
    </DialogRootContext.Provider>
  )
}

/**
 * Props for {@link DialogRoot}.
 */
export type DialogRootProps = {
  children?: JSX.Element
  /** Whether the dialog is currently open. */
  open?: boolean
  /**
   * Whether the dialog is initially open.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Determines if the dialog enters a modal state when open.
   * - `true`: focus trap + scroll lock + outside pointer block
   * - `false`: free interaction with the page
   * - `'trap-focus'`: focus trap without scroll lock / pointer block
   * @default true
   */
  modal?: boolean | 'trap-focus'
  /** Called when the dialog should open or close. */
  onOpenChange?: (
    open: boolean,
    eventDetails: DialogRootChangeEventDetails
  ) => void
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void
  /**
   * Whether to prevent closing on outside presses.
   * @default false
   */
  disablePointerDismissal?: boolean
  /**
   * Imperative actions (`unmount`, `close`).
   * When `unmount` is used for external exit animations, call
   * `preventUnmountOnClose` via the change-details helper or keep the popup
   * mounted until `actionsRef.unmount()` runs.
   */
  actionsRef?: DialogRootActions
}

/** Imperative actions exposed via `actionsRef`. */
export type DialogRootActions = {
  unmount: () => void
  close: () => void
}

/** Change-event reason for Dialog. */
export type DialogRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.none

/** Change-event details for Dialog. */
export type DialogRootChangeEventDetails =
  BaseUIChangeEventDetails<DialogRootChangeEventReason> & {
    preventUnmountOnClose?: () => void
  }
