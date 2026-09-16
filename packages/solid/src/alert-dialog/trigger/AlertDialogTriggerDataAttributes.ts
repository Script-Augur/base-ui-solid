import { DialogTriggerDataAttributes } from "../../dialog/trigger/DialogTriggerDataAttributes"

/**
 * Data attributes for {@link AlertDialogTrigger}.
 */
export enum AlertDialogTriggerDataAttributes {
  /**
   * Present when the corresponding alert dialog is open.
   */
  popupOpen = DialogTriggerDataAttributes.popupOpen,
  /**
   * Present when the trigger is disabled.
   */
  disabled = DialogTriggerDataAttributes.disabled,
}
