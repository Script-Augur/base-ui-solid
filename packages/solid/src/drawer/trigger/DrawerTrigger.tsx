import { DialogTrigger } from '../../dialog/trigger/DialogTrigger'
import { DialogTriggerDataAttributes } from '../../dialog/trigger/DialogTriggerDataAttributes'

import type {
  DialogTriggerProps,
  DialogTriggerState,
} from '../../dialog/trigger/DialogTrigger'

/**
 * A button that opens the drawer.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerTrigger = DialogTrigger

export { DialogTriggerDataAttributes as DrawerTriggerDataAttributes }

/** Props for {@link DrawerTrigger}. */
export type DrawerTriggerProps = DialogTriggerProps

/** Public state for {@link DrawerTrigger}. */
export type DrawerTriggerState = DialogTriggerState
