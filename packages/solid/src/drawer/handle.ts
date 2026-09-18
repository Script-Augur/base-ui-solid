import { DialogHandle } from '../dialog/store/DialogHandle'

/**
 * Controls a Drawer imperatively and associates detached `Drawer.Trigger`
 * components with a `Drawer.Root`. Create one with `Drawer.createHandle()` and
 * pass it to the `handle` prop of the root and of any triggers rendered outside
 * of it.
 *
 * The imperative methods take effect only while a root using this handle is
 * mounted; calls made before a root attaches (or after it unmounts) are ignored.
 *
 * @typeParam TPayload - Optional payload type for `openWithPayload` / trigger payloads.
 */
export class DrawerHandle<TPayload = unknown> extends DialogHandle<TPayload> {
  /** Brand so Drawer handles are distinct from Dialog handles at the type level. */
  declare private readonly __drawerBrand: void
}

/**
 * Creates a new handle to connect a Drawer.Root with detached Drawer.Trigger components.
 *
 * @typeParam TPayload - Optional payload type.
 * @returns A new {@link DrawerHandle}.
 */
export function createDrawerHandle<
  TPayload = unknown,
>(): DrawerHandle<TPayload> {
  return new DrawerHandle<TPayload>()
}
