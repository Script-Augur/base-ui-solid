import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

const ToolbarGroupContext = createContext<ToolbarGroupContextValue | undefined>(
  undefined
)

export { ToolbarGroupContext }

/**
 * Reads the nearest {@link ToolbarGroup} context, if any.
 *
 * @returns Context value, or `undefined` outside a toolbar group.
 */
export function useToolbarGroupContext(): ToolbarGroupContextValue | undefined {
  return useContext(ToolbarGroupContext)
}

/**
 * Shared disabled state for items nested under {@link ToolbarGroup}.
 */
export interface ToolbarGroupContextValue {
  /** Whether all toolbar items in the group ignore user interaction. */
  disabled: Accessor<boolean>
}
