import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useTabsListContext } from '../list/TabsListContext'
import { useTabsRootContext } from '../root/TabsRootContext'

import { getCssDimensions } from './getCssDimensions'
import { TabsIndicatorCssVars } from './TabsIndicatorCssVars'
import { TabsIndicatorDataAttributes } from './TabsIndicatorDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TabsRootState } from '../root/TabsRoot'
import type {
  TabsActivationDirection,
  TabsIndicatorPosition,
  TabsIndicatorSize,
} from '../trigger/TabTrigger'
import type { JSX } from 'solid-js'

/**
 * A visual indicator aligned with the currently active tab.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 *
 * @param componentProps - {@link TabsIndicatorProps} for this instance.
 * @returns The rendered indicator, or `null` before geometry is available.
 */
export function TabsIndicator(
  componentProps: TabsIndicatorProps
): JSX.Element | null {
  const root = useTabsRootContext()
  const list = useTabsListContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'renderBeforeHydration',
    'ref',
  ])

  // Accepted for API parity; SSR prehydration script is not ported to Solid.
  void local.renderBeforeHydration

  const [indicatorVersion, indicatorVersionAssign] = createSignal(0)

  createEffect(() =>
    list.registerIndicatorUpdateListener(() => {
      indicatorVersionAssign(version => version + 1)
    })
  )

  const geometry = createMemo(() => {
    indicatorVersion()
    root.value()
    list.tabsListElement()
    const selectedValue = root.value()
    const tabsListElement = list.tabsListElement()

    if (selectedValue == null || tabsListElement == null) {
      return null
    }

    const activeTab = root.getTabElementBySelectedValue(selectedValue)
    if (activeTab == null) return null

    const { width: computedWidth, height: computedHeight } =
      getCssDimensions(activeTab)
    const { width: tabListWidth, height: tabListHeight } =
      getCssDimensions(tabsListElement)
    const tabRect = activeTab.getBoundingClientRect()
    const tabsListRect = tabsListElement.getBoundingClientRect()
    const scaleX = tabListWidth > 0 ? tabsListRect.width / tabListWidth : 1
    const scaleY = tabListHeight > 0 ? tabsListRect.height / tabListHeight : 1
    const hasNonZeroScale = scaleX > Number.EPSILON && scaleY > Number.EPSILON

    let left = 0
    let top = 0

    if (hasNonZeroScale) {
      const tabLeftDelta = tabRect.left - tabsListRect.left
      const tabTopDelta = tabRect.top - tabsListRect.top
      left =
        tabLeftDelta / scaleX +
        tabsListElement.scrollLeft -
        tabsListElement.clientLeft
      top =
        tabTopDelta / scaleY +
        tabsListElement.scrollTop -
        tabsListElement.clientTop
    } else {
      left = activeTab.offsetLeft
      top = activeTab.offsetTop
    }

    const width = computedWidth
    const height = computedHeight
    const right = tabsListElement.scrollWidth - left - width
    const bottom = tabsListElement.scrollHeight - top - height

    return {
      left,
      right,
      top,
      bottom,
      width,
      height,
    }
  })

  const state: TabsIndicatorState = {
    get orientation() {
      return root.orientation()
    },
    get activeTabPosition() {
      return activeTabPosition()
    },
    get activeTabSize() {
      return activeTabSize()
    },
    get tabActivationDirection() {
      return root.tabActivationDirection()
    },
  }

  if (root.value() == null) {
    return null
  }

  return createRender<TabsIndicatorState, Record<string, unknown>>({
    defaultElement: 'span',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      role: 'presentation',
      get style() {
        const base = indicatorStyle()
        const user = local.style
        if (base && user && typeof user === 'object' && !Array.isArray(user)) {
          return { ...base, ...(user as Record<string, string>) }
        }
        return base ?? user
      },
      get hidden() {
        return !displayIndicator()
      },
      get class() {
        return local.class
      },
      get [TabsIndicatorDataAttributes.activationDirection]() {
        return root.tabActivationDirection()
      },
      get [TabsIndicatorDataAttributes.orientation]() {
        return root.orientation()
      },
      ref: local.ref,
    }),
  })

  /**
   * Active tab box relative to the list, or `null` when geometry is unavailable.
   *
   * @returns Left/right/top/bottom in pixels.
   */
  function activeTabPosition(): TabsIndicatorPosition | null {
    const g = geometry()
    if (!g) return null
    return {
      left: g.left,
      right: g.right,
      top: g.top,
      bottom: g.bottom,
    }
  }

  /**
   * Active tab width and height, or `null` when geometry is unavailable.
   *
   * @returns Size in pixels.
   */
  function activeTabSize(): TabsIndicatorSize | null {
    const g = geometry()
    if (!g) return null
    return { width: g.width, height: g.height }
  }

  /**
   * Whether the indicator has a non-zero box to paint.
   *
   * @returns `true` when width and height are both greater than zero.
   */
  function displayIndicator() {
    const g = geometry()
    return g != null && g.width > 0 && g.height > 0
  }

  /**
   * CSS custom properties for the active tab geometry.
   *
   * @returns Style bag, or `undefined` when geometry is unavailable.
   */
  function indicatorStyle(): JSX.CSSProperties | undefined {
    const g = geometry()
    if (!g) return undefined
    return {
      [TabsIndicatorCssVars.activeTabLeft]: `${g.left}px`,
      [TabsIndicatorCssVars.activeTabRight]: `${g.right}px`,
      [TabsIndicatorCssVars.activeTabTop]: `${g.top}px`,
      [TabsIndicatorCssVars.activeTabBottom]: `${g.bottom}px`,
      [TabsIndicatorCssVars.activeTabWidth]: `${g.width}px`,
      [TabsIndicatorCssVars.activeTabHeight]: `${g.height}px`,
    }
  }
}

/** Public state exposed to `render` functions on the indicator. */
export interface TabsIndicatorState extends TabsRootState {
  /** Bounding box of the active tab relative to the list, or `null`. */
  activeTabPosition: TabsIndicatorPosition | null
  /** Size of the active tab, or `null`. */
  activeTabSize: TabsIndicatorSize | null
  /** Direction of the last tab activation. */
  tabActivationDirection: TabsActivationDirection
}

/** Props for {@link TabsIndicator}. */
export type TabsIndicatorProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  /**
   * Accepted for API parity with React Base UI.
   * SSR prehydration script is not implemented in the Solid port.
   * @default false
   */
  renderBeforeHydration?: boolean
  /** Custom renderer for the indicator host. */
  render?: RenderProp<TabsIndicatorState, Record<string, unknown>>
}
