import { BasePopupHandle } from '../../internals/popups'

import { createNullMenuStore } from './MenuStore'

import type { MenuHandleStore, MenuStore } from './MenuStore'

/**
 * Controls a Menu imperatively and associates detached `Menu.Trigger` components with a
 * `Menu.Root`. Create one with `Menu.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 *
 * @typeParam TPayload - Optional payload type.
 */
export class MenuHandle<TPayload = unknown> extends BasePopupHandle<
  MenuHandleStore<TPayload>,
  MenuStore<TPayload>
> {
  /**
   * Creates a menu handle with an inert fallback store.
   */
  constructor() {
    super(createNullMenuStore<TPayload>(), 'Menu')
  }

  /**
   * Opens the menu and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId - ID of the trigger to associate with the menu. Required (unlike Dialog).
   */
  open(triggerId: string): void {
    this.openByTrigger(triggerId)
  }

  /**
   * Closes the menu.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close(): void {
    this.closePopup()
  }

  /**
   * Whether the menu is currently open. Returns `false` while no root is attached.
   */
  get isOpen(): boolean {
    return Boolean(this.attachedStore?.select('open'))
  }
}

/**
 * Creates a new handle to connect a Menu.Root with detached Menu.Trigger components.
 *
 * @typeParam TPayload - Optional payload type.
 * @returns A new {@link MenuHandle}.
 */
export function createMenuHandle<TPayload = unknown>(): MenuHandle<TPayload> {
  return new MenuHandle<TPayload>()
}
