import { BasePopupHandle } from '../../internals/popups'

import { createNullPopoverStore } from './PopoverStore'

import type { PopoverHandleStore, PopoverStore } from './PopoverStore'

/**
 * Controls a Popover imperatively and associates detached `Popover.Trigger` components with a
 * `Popover.Root`. Create one with `Popover.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 *
 * @typeParam TPayload - Optional payload type.
 */
export class PopoverHandle<TPayload = unknown> extends BasePopupHandle<
  PopoverHandleStore<TPayload>,
  PopoverStore<TPayload>
> {
  /**
   * Creates a popover handle with an inert fallback store.
   */
  constructor() {
    super(createNullPopoverStore<TPayload>(), 'Popover')
  }

  /**
   * Opens the popover and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId - ID of the trigger to associate with the popover.
   */
  open(triggerId?: string | null): void {
    this.openByTrigger(triggerId)
  }

  /**
   * Closes the popover.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close(): void {
    this.closePopup()
  }

  /**
   * Whether the popover is currently open. Returns `false` while no root is attached.
   */
  get isOpen(): boolean {
    return Boolean(this.attachedStore?.select('open'))
  }
}

/**
 * Creates a new handle to connect a Popover.Root with detached Popover.Trigger components.
 *
 * @typeParam TPayload - Optional payload type.
 * @returns A new {@link PopoverHandle}.
 */
export function createPopoverHandle<
  TPayload = unknown,
>(): PopoverHandle<TPayload> {
  return new PopoverHandle<TPayload>()
}
