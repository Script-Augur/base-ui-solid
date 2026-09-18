import { DialogViewport } from '../../dialog/viewport/DialogViewport'

import type {
  DialogViewportProps,
  DialogViewportState,
} from '../../dialog/viewport/DialogViewport'

/**
 * A positioning container for the drawer popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Lite: reuses Dialog Viewport (no swipe-dismiss / snap drag pipeline).
 * Full upstream Drawer.Viewport gesture logic is deferred.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerViewport = DialogViewport

/** Props for {@link DrawerViewport}. */
export type DrawerViewportProps = DialogViewportProps

/** Public state for {@link DrawerViewport}. */
export type DrawerViewportState = DialogViewportState
