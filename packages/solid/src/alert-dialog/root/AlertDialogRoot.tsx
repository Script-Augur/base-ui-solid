import { useRenderDialogRoot } from "../../dialog/root/DialogRoot"

import type {
  DialogRootActions,
  DialogRootChangeEventDetails,
  DialogRootChangeEventReason,
  DialogRootProps,
} from "../../dialog/root/DialogRoot"
import type { JSX } from "solid-js"

/**
 * Groups all parts of the alert dialog.
 * Doesn't render its own HTML element.
 *
 * Thin wrapper over Dialog via `useRenderDialogRoot('alert-dialog')` — forces
 * modal behavior, disables pointer dismissal, and sets popup role `alertdialog`
 * (matches upstream `@base-ui/react` Alert Dialog).
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 *
 * @param componentProps - Root props (`open`, `defaultOpen`, `onOpenChange`, …).
 * @returns A Solid JSX fragment wrapping children in Dialog context.
 *
 * @example
 * ```tsx
 * import { AlertDialog } from "@script-augur/base-ui-solid/alert-dialog"
 *
 * <AlertDialog.Root>
 *   <AlertDialog.Trigger>Delete</AlertDialog.Trigger>
 *   <AlertDialog.Portal>
 *     <AlertDialog.Backdrop />
 *     <AlertDialog.Popup>
 *       <AlertDialog.Title>Confirm</AlertDialog.Title>
 *       <AlertDialog.Close>Cancel</AlertDialog.Close>
 *     </AlertDialog.Popup>
 *   </AlertDialog.Portal>
 * </AlertDialog.Root>
 * ```
 */
export function AlertDialogRoot(
  componentProps: AlertDialogRootProps,
): JSX.Element {
  return useRenderDialogRoot("alert-dialog", componentProps)
}

/**
 * Props for {@link AlertDialogRoot}.
 *
 * Omits `modal` and `disablePointerDismissal` — Alert Dialog always uses
 * modal + no outside-press dismiss (matches `@base-ui/react@1.7.0`).
 * Role is internal via root mode (not a public Dialog prop).
 */
export type AlertDialogRootProps = Omit<
  DialogRootProps,
  "modal" | "disablePointerDismissal"
>

/** Imperative actions exposed via `actionsRef`. */
export type AlertDialogRootActions = DialogRootActions

/** Change-event reason for Alert Dialog. */
export type AlertDialogRootChangeEventReason = DialogRootChangeEventReason

/** Change-event details for Alert Dialog. */
export type AlertDialogRootChangeEventDetails = DialogRootChangeEventDetails
