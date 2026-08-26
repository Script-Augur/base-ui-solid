import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

const TabsListContext = createContext<TabsListContextValue | undefined>(
  undefined
)

export { TabsListContext }

/**
 * Reads the nearest {@link TabsList} context.
 *
 * @returns Context value.
 * @throws If used outside a Tabs list.
 */
export function useTabsListContext(): TabsListContextValue {
  const context = useContext(TabsListContext)
  if (!context) {
    throw new Error(
      'Base UI: Tabs list parts must be placed within <Tabs.List>.'
    )
  }
  return context
}

/**
 * Shared state for tab parts nested under {@link TabsList}.
 */
export interface TabsListContextValue {
  /** Whether arrow-key focus activates tabs. */
  activateOnFocus: Accessor<boolean>
  /**
   * Subscribes indicator geometry updates.
   *
   * @param listener - Called when the list should remeasure the indicator.
   * @returns Unsubscribe function.
   */
  registerIndicatorUpdateListener: (listener: () => void) => () => void
  /**
   * Observes tab element resize for indicator updates.
   *
   * @param element - Tab element to observe.
   * @returns Unsubscribe function that disconnects the observer for this element.
   */
  registerTabResizeObserverElement: (element: HTMLElement) => () => void
  /** The tab list host element. */
  tabsListElement: Accessor<HTMLElement | null>
}
