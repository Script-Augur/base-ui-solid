import { createEffect, createSignal, onCleanup, splitProps } from 'solid-js'

import { CompositeRoot } from '../../internals/composite/root/CompositeRoot'
import { useTabsRootContext } from '../root/TabsRootContext'

import { TabsListContext } from './TabsListContext'
import { TabsListDataAttributes } from './TabsListDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TabsRootState } from '../root/TabsRoot'
import type { TabTriggerMetadata } from '../trigger/TabTrigger'
import type { JSX } from 'solid-js'

/**
 * Groups the individual tab buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 *
 * @param componentProps - {@link TabsListProps} for this instance.
 * @returns The rendered tab list element.
 */
export function TabsList(componentProps: TabsListProps): JSX.Element {
  const root = useTabsRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'activateOnFocus',
    'loopFocus',
    'ref',
    'children',
  ])

  const activateOnFocus = () => local.activateOnFocus ?? false
  const loopFocus = () => local.loopFocus ?? true

  const [highlightedTabIndex, highlightedTabIndexAssign] = createSignal(0)
  const [tabsListElement, tabsListElementAssign] =
    createSignal<HTMLElement | null>(null)

  const indicatorUpdateListeners = new Set<() => void>()
  const tabResizeObserverElements = new Set<HTMLElement>()
  let resizeObserver: ResizeObserver | null = null

  createEffect(() => {
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      indicatorUpdateListeners.forEach(listener => listener())
    })

    resizeObserver = observer

    const listEl = tabsListElement()
    if (listEl) observer.observe(listEl)

    tabResizeObserverElements.forEach(element => observer.observe(element))

    onCleanup(() => {
      observer.disconnect()
      resizeObserver = null
    })
  })

  const state: TabsListState = {
    get orientation() {
      return root.orientation()
    },
    get tabActivationDirection() {
      return root.tabActivationDirection()
    },
  }

  const contextValue = {
    activateOnFocus,
    registerIndicatorUpdateListener,
    registerTabResizeObserverElement,
    tabsListElement,
  }

  return (
    <TabsListContext.Provider value={contextValue}>
      <CompositeRoot<TabTriggerMetadata, TabsListState>
        render={local.render}
        class={local.class}
        style={local.style}
        state={state}
        refs={[setRootRef]}
        props={[defaultProps, elementProps]}
        highlightedIndex={highlightedTabIndex}
        onHighlightedIndexChange={highlightedTabIndexAssign}
        enableHomeAndEndKeys
        loopFocus={loopFocus}
        orientation={root.orientation}
        onMapChange={root.tabMapAssign}
        tag="div"
      >
        {local.children}
      </CompositeRoot>
    </TabsListContext.Provider>
  )

  /**
   * Subscribes to indicator remesure notifications.
   *
   * @param listener - Called when the list or a tab resizes.
   * @returns Unsubscribe function.
   */
  function registerIndicatorUpdateListener(listener: () => void) {
    indicatorUpdateListeners.add(listener)
    return () => {
      indicatorUpdateListeners.delete(listener)
    }
  }

  /**
   * Observes `element` with the list ResizeObserver.
   *
   * @param element - Tab element to observe.
   * @returns Unsubscribe function that unobserves the element.
   */
  function registerTabResizeObserverElement(element: HTMLElement) {
    tabResizeObserverElements.add(element)
    resizeObserver?.observe(element)
    return () => {
      tabResizeObserverElements.delete(element)
      resizeObserver?.unobserve(element)
    }
  }

  /**
   * Default host props for the tablist: role, orientation, data attributes.
   *
   * @returns Props bag for {@link CompositeRoot}.
   */
  function defaultProps(): Record<string, unknown> {
    return {
      role: 'tablist',
      get 'aria-orientation'() {
        return root.orientation() === 'vertical' ? 'vertical' : undefined
      },
      get [TabsListDataAttributes.activationDirection]() {
        return root.tabActivationDirection()
      },
      get [TabsListDataAttributes.orientation]() {
        return root.orientation()
      },
    }
  }

  /**
   * Stores the list host and forwards the same node to `ref`.
   *
   * @param el - Mounted list element, or `null` on unmount.
   */
  function setRootRef(el: HTMLElement | null) {
    tabsListElementAssign(el)
    const userRef = local.ref
    if (typeof userRef === 'function') userRef(el as HTMLDivElement)
  }
}

/** Public state exposed to `render` functions on the list. */
export interface TabsListState extends TabsRootState {}

/** Props for {@link TabsList}. */
export type TabsListProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /** Whether arrow-key focus activates tabs. @default false */
  activateOnFocus?: boolean
  /** Whether arrow keys wrap at list ends. @default true */
  loopFocus?: boolean
  /** Custom renderer for the list host. */
  render?: RenderProp<TabsListState, Record<string, unknown>>
}
