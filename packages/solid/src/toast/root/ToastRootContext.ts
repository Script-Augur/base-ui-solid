import { createContext, useContext } from 'solid-js'

import type { ToastObject } from '../useToastManager'
import type { Accessor } from 'solid-js'

const ToastRootContext = createContext<ToastRootContextValue | undefined>(
  undefined
)
export { ToastRootContext }
/**
 * Reads toast root context.
 *
 * @returns Root context value.
 * @throws Outside `<Toast.Root>`.
 */
export function useToastRootContext(): ToastRootContextValue {
  const context = useContext(ToastRootContext)
  if (!context) {
    throw new Error(
      'Base UI: ToastRootContext is missing. Toast parts must be used within <Toast.Root>.'
    )
  }
  return context
}
/** Context shared by toast root parts. */
export interface ToastRootContextValue {
  toast: Accessor<ToastObject<Record<string, never>>>
  titleIdAssign: (id: string | undefined) => void
  descriptionIdAssign: (id: string | undefined) => void
  titleId: Accessor<string | undefined>
  descriptionId: Accessor<string | undefined>
  visibleIndex: Accessor<number>
  expanded: Accessor<boolean>
  recalculateHeight: (flushSync?: boolean) => void
}
