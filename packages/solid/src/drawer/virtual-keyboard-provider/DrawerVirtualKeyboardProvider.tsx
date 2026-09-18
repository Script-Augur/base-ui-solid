import type { JSX } from 'solid-js'

/**
 * Provides keyboard-aware focus and scroll handling for bottom-sheet drawers
 * with form fields.
 *
 * **Lite:** passthrough provider — virtual-keyboard realignment is deferred.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param props - Provider props (`children`).
 * @returns Children unchanged.
 */
export function DrawerVirtualKeyboardProvider(
  props: DrawerVirtualKeyboardProviderProps
): JSX.Element {
  return <>{props.children}</>
}

/** Props for {@link DrawerVirtualKeyboardProvider}. */
export type DrawerVirtualKeyboardProviderProps = {
  children?: JSX.Element
}
