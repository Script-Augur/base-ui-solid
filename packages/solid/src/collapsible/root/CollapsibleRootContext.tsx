import { createContext, useContext } from 'solid-js'

import type { CollapsibleRootState } from './CollapsibleRoot'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { Accessor, Setter } from 'solid-js'

const CollapsibleRootContext = createContext<
  CollapsibleRootContextValue | undefined
>(undefined)

export { CollapsibleRootContext }

/**
 * Reads the nearest {@link CollapsibleRoot} context.
 *
 * @returns Context value.
 * @throws If used outside a Collapsible root.
 */
export function useCollapsibleRootContext(): CollapsibleRootContextValue {
  const context = useContext(CollapsibleRootContext)
  if (!context) {
    throw new Error(
      'Base UI: CollapsibleTrigger / CollapsiblePanel must be used within Collapsible.Root.'
    )
  }
  return context
}

/**
 * Shared state for collapsible parts nested under {@link CollapsibleRoot}.
 */
export interface CollapsibleRootContextValue {
  /** Generated fallback panel id when the panel does not set `id`. */
  defaultPanelId: string
  /** Whether the collapsible ignores user interaction. */
  disabled: Accessor<boolean>
  /** Toggles open state from the trigger (cancelable). */
  handleTrigger: (event: Event) => void
  /**
   * Whether the panel is considered mounted for visibility purposes.
   */
  mounted: Accessor<boolean>
  /** Whether the panel is open. */
  open: Accessor<boolean>
  /** Active panel id for `aria-controls` (undefined when panel unregistered). */
  panelId: Accessor<string | undefined>
  /** Public state bag for render props / data attributes. */
  state: CollapsibleRootState
  mountedAssign: Setter<boolean>
  openAssign: (next: boolean) => void
  registeredPanelIdAssign: Setter<string | null | undefined>
  onOpenChange: (
    open: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
}
