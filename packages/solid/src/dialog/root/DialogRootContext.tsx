import { createContext, useContext } from "solid-js"

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from "../../internals/createChangeEventDetails"
import type { TransitionStatus } from "../../internals/createTransitionStatus"
import type { Accessor, Setter } from "solid-js"

/**
 * Shared Dialog root state for compound parts.
 */
export const DialogRootContext = createContext<DialogRootContextValue>()

/**
 * Reads the nearest {@link DialogRoot} context.
 *
 * @param optional - When `true`, returns `undefined` outside a root (nested detection).
 * @returns Context value, or `undefined` when `optional` and no provider.
 */
export function useDialogRootContext(optional?: false): DialogRootContextValue
export function useDialogRootContext(
  optional: true,
): DialogRootContextValue | undefined
export function useDialogRootContext(
  optional = false,
): DialogRootContextValue | undefined {
  const context = useContext(DialogRootContext)
  if (context == null && !optional) {
    throw new Error("Base UI: Dialog parts must be used within <Dialog.Root>.")
  }
  return context
}

/**
 * Context value published by {@link DialogRoot}.
 */
export interface DialogRootContextValue {
  open: Accessor<boolean>
  openAssign: (next: boolean) => void
  setOpen: (
    next: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>,
  ) => void
  modal: Accessor<boolean | "trap-focus">
  disablePointerDismissal: Accessor<boolean>
  nested: Accessor<boolean>
  nestedOpenDialogCount: Accessor<number>
  onNestedDialogOpen: (ownChildrenCount: number) => void
  onNestedDialogClose: () => void
  mounted: Accessor<boolean>
  mountedAssign: Setter<boolean>
  transitionStatus: Accessor<TransitionStatus>
  titleElementId: Accessor<string | undefined>
  titleElementIdAssign: Setter<string | undefined>
  descriptionElementId: Accessor<string | undefined>
  descriptionElementIdAssign: Setter<string | undefined>
  popupElement: Accessor<HTMLElement | null>
  popupElementAssign: Setter<HTMLElement | null>
  viewportElement: Accessor<HTMLElement | null>
  viewportElementAssign: Setter<HTMLElement | null>
  triggerElement: Accessor<HTMLElement | null>
  triggerElementAssign: Setter<HTMLElement | null>
  backdropElement: Accessor<HTMLElement | null>
  backdropElementAssign: Setter<HTMLElement | null>
  internalBackdropElement: Accessor<HTMLElement | null>
  internalBackdropElementAssign: Setter<HTMLElement | null>
  portalId: Accessor<string>
  preventUnmountOnClose: Accessor<boolean>
  preventUnmountOnCloseAssign: Setter<boolean>
  /** Popup `initialFocus` prop (published by {@link DialogPopup}). */
  popupInitialFocus: Accessor<boolean | HTMLElement | null | undefined>
  popupInitialFocusAssign: Setter<boolean | HTMLElement | null | undefined>
  /** Popup `finalFocus` prop (published by {@link DialogPopup}). */
  popupFinalFocus: Accessor<boolean | HTMLElement | null | undefined>
  popupFinalFocusAssign: Setter<boolean | HTMLElement | null | undefined>
  onOpenChangeComplete?: (open: boolean) => void
  /** Popup ARIA role — `'alertdialog'` when used by Alert Dialog. */
  role: "dialog" | "alertdialog"
}
