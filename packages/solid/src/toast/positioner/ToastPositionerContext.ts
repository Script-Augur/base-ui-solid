import { createContext, useContext } from 'solid-js'

import type { Align, Side } from '../../popover/positioner/placement'
import type { Accessor, JSX } from 'solid-js'

const ToastPositionerContext = createContext<
  ToastPositionerContextValue | undefined
>(undefined)
export { ToastPositionerContext }
/**
 * Reads toast positioner context.
 *
 * @returns Positioner context.
 * @throws Outside `<Toast.Positioner>`.
 */
export function useToastPositionerContext(): ToastPositionerContextValue {
  const context = useContext(ToastPositionerContext)
  if (context === undefined) {
    throw new Error(
      'Base UI: ToastPositionerContext is missing. ToastPositioner parts must be placed within <Toast.Positioner>.'
    )
  }
  return context
}
/** Context for toast arrow positioning. */
export interface ToastPositionerContextValue {
  side: Accessor<Side>
  align: Accessor<Align>
  arrowRef: (el: HTMLElement | null) => void
  arrowUncentered: Accessor<boolean>
  arrowStyles: Accessor<JSX.CSSProperties>
}
