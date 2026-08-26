import { createContext, useContext } from 'solid-js'

import type { TabsRootChangeEventDetails } from './TabsRoot'
import type { CompositeMetadata } from '../../internals/composite/list/CompositeList'
import type { Orientation } from '../../separator/Separator'
import type {
  TabTriggerMetadata,
  TabsActivationDirection,
  TabsValue,
} from '../trigger/TabTrigger'
import type { Accessor } from 'solid-js'

const TabsRootContext = createContext<TabsRootContextValue | undefined>(
  undefined
)

export { TabsRootContext }

/**
 * Reads the nearest {@link TabsRoot} context.
 *
 * @returns Context value.
 * @throws If used outside a Tabs root.
 */
export function useTabsRootContext(): TabsRootContextValue {
  const context = useContext(TabsRootContext)
  if (!context) {
    throw new Error('Base UI: Tabs parts must be placed within <Tabs.Root>.')
  }
  return context
}

/**
 * Shared state for tab parts nested under {@link TabsRoot}.
 */
export interface TabsRootContextValue {
  /** Currently selected tab value. */
  value: Accessor<TabsValue>
  /** Sets the selected tab (cancelable via event details).
   *
   * @param value - Newly selected tab value.
   * @param eventDetails - Cancelable details including activation direction.
   */
  onValueChange: (
    value: TabsValue,
    eventDetails: TabsRootChangeEventDetails
  ) => void
  /** Root layout orientation. */
  orientation: Accessor<Orientation>
  /**
   * Resolves the tab element for a value.
   *
   * @param selectedValue - Tab value to look up.
   * @returns The tab element, or `null`.
   */
  getTabElementBySelectedValue: (selectedValue: TabsValue) => HTMLElement | null
  /**
   * Registers the rendered tab element for activation-direction measurement.
   *
   * @param tabValue - Tab value for this element.
   * @param element - Mounted tab, or `null` on unmount.
   */
  registerTabElement: (tabValue: TabsValue, element: HTMLElement | null) => void
  /**
   * Resolves the tab `id` for a panel value.
   *
   * @param panelValue - Panel value to look up.
   * @returns Matching tab id, if any.
   */
  getTabIdByPanelValue: (panelValue: TabsValue) => string | undefined
  /**
   * Resolves the panel `id` for a tab value.
   *
   * @param tabValue - Tab value to look up.
   * @returns Matching panel id, if any.
   */
  getTabPanelIdByValue: (tabValue: TabsValue) => string | undefined
  /**
   * Registers a mounted panel id for `aria-controls`.
   *
   * @param panelValue - Panel value being registered.
   * @param panelId - Generated panel element id.
   * @returns Unsubscribe function.
   */
  registerMountedTabPanel: (
    panelValue: TabsValue,
    panelId: string
  ) => () => void
  /**
   * Updates the tab metadata map from {@link TabsList}.
   *
   * @param map - Composite metadata for registered tabs.
   */
  tabMapAssign: (map: Map<Node, CompositeMetadata<TabTriggerMetadata>>) => void
  /** Direction of the last tab activation. */
  tabActivationDirection: Accessor<TabsActivationDirection>
  /** Bumps when the selected value changes so tabs refresh data attrs. */
  selectionVersion: Accessor<number>
}
