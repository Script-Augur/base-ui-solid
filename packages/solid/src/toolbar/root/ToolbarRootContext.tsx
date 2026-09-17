import { createContext, useContext } from 'solid-js'

import type { Orientation } from '../../separator/Separator'
import type { Accessor } from 'solid-js'

const ToolbarRootContext = createContext<ToolbarRootContextValue | undefined>(
  undefined
)

export { ToolbarRootContext }

/**
 * Reads the nearest {@link ToolbarRoot} context.
 *
 * @param optional - When `true`, returns `undefined` outside a toolbar.
 */
export function useToolbarRootContext(
  optional?: false
): ToolbarRootContextValue
export function useToolbarRootContext(
  optional: true
): ToolbarRootContextValue | undefined
export function useToolbarRootContext(
  optional = false
): ToolbarRootContextValue | undefined {
  const context = useContext(ToolbarRootContext)
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToolbarRootContext is missing. Toolbar parts must be placed within <Toolbar.Root>.'
    )
  }
  return context
}

/**
 * Shared state for toolbar parts nested under {@link ToolbarRoot}.
 */
export interface ToolbarRootContextValue {
  /** Whether the toolbar (and nested items) ignore user interaction. */
  disabled: Accessor<boolean>
  /** Layout / arrow-key orientation of the toolbar. */
  orientation: Accessor<Orientation>
}
