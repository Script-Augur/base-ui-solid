import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { BasePopupHandle } from '../../internals/popups'

import { createNullDialogStore } from './DialogStore'

import type { DialogHandleStore, DialogStore } from './DialogStore'

/**
 * Controls a Dialog imperatively and associates detached `Dialog.Trigger` components with a
 * `Dialog.Root`. Create one with `Dialog.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 *
 * @typeParam TPayload - Optional payload type for `openWithPayload` / trigger payloads.
 */
export class DialogHandle<TPayload = unknown> extends BasePopupHandle<
  DialogHandleStore<TPayload>,
  DialogStore<TPayload>
> {
  /**
   * Creates a dialog handle with an inert fallback store.
   */
  constructor() {
    super(createNullDialogStore<TPayload>(), 'Dialog', false)
  }

  /**
   * Opens the dialog, optionally associating it with a trigger.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId - ID of the trigger to associate, or `null` to open unassociated.
   */
  open(triggerId?: string | null): void {
    this.openByTrigger(triggerId)
  }

  /**
   * Opens the dialog with the given payload, without associating it with any trigger.
   *
   * Writes `payload` onto the attached root store. Root render-prop children that
   * consume `store.payload` are **not** implemented yet (see Dialog
   * `UPSTREAM_TEST_PARITY.md`); until then callers may still set payload for
   * future consumers / imperative reads of the store, but the UI will not
   * re-render from it via children-as-function.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param payload - Payload stored on the attached root's popup store.
   */
  openWithPayload(payload: TPayload): void {
    const attachedStore = this.attachedStore
    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Base UI: DialogHandle.openWithPayload() was called while no root using this handle is mounted. ' +
            'The call and its payload were ignored; mount a root with this handle before opening it imperatively.'
        )
      }
      return
    }
    attachedStore.set('payload', payload)
    attachedStore.setOpen(
      true,
      createChangeEventDetails(REASONS.imperativeAction)
    )
  }

  /**
   * Closes the dialog.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close(): void {
    this.closePopup()
  }

  /**
   * Whether the dialog is currently open. Returns `false` while no root is attached.
   */
  get isOpen(): boolean {
    return Boolean(this.attachedStore?.select('open'))
  }
}

/**
 * Creates a new handle to connect a Dialog.Root with detached Dialog.Trigger components.
 *
 * @typeParam TPayload - Optional payload type.
 * @returns A new {@link DialogHandle}.
 */
export function createDialogHandle<
  TPayload = unknown,
>(): DialogHandle<TPayload> {
  return new DialogHandle<TPayload>()
}
