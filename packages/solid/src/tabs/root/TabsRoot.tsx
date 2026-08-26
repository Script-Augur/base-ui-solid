import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
} from 'solid-js'

import { CompositeList } from '../../internals/composite/list/CompositeList'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'

import { TabsRootContext } from './TabsRootContext'
import { TabsRootDataAttributes } from './TabsRootDataAttributes'

import type { CompositeMetadata } from '../../internals/composite/list/CompositeList'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { Orientation } from '../../separator/Separator'
import type {
  TabTriggerMetadata,
  TabsActivationDirection,
} from '../trigger/TabTrigger'
import type { JSX } from 'solid-js'

/**
 * Groups the tabs and the corresponding panels.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 *
 * @param componentProps - {@link TabsRootProps} for this instance.
 * @returns The rendered tabs root element.
 */
export function TabsRoot(componentProps: TabsRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'defaultValue',
    'onValueChange',
    'orientation',
    'value',
    'ref',
  ])

  const hasExplicitDefaultValueProp = componentProps.defaultValue !== undefined
  const initialDefaultValue = hasExplicitDefaultValueProp
    ? local.defaultValue
    : 0

  const tabPanelRefs = { current: [] as Array<HTMLElement | null> }
  const tabElements = new Map<TabsValue, HTMLElement>()
  const [mountedTabPanels, mountedTabPanelsAssign] = createSignal(
    new Map<TabsValue, string>()
  )
  const [tabMap, tabMapAssign] = createSignal(
    new Map<Node, CompositeMetadata<TabTriggerMetadata>>()
  )
  const [value, valueAssign] = createControlled<TabsValue>({
    value: () => local.value,
    defaultValue: initialDefaultValue,
  })
  const [activationDirectionState, activationDirectionStateAssign] =
    createSignal<{
      previousValue: TabsValue
      tabActivationDirection: TabsActivationDirection
    }>({
      previousValue: value(),
      tabActivationDirection: 'none',
    })
  const [selectionVersion, selectionVersionAssign] = createSignal(0)

  let shouldNotifyInitialValueChange = !hasExplicitDefaultValueProp
  let shouldHonorDisabledDefaultValue = hasExplicitDefaultValueProp
  let didRegisterTabs = false
  let lastKnownTabElement: Node | undefined

  const state: TabsRootState = {
    get orientation() {
      return orientation()
    },
    get tabActivationDirection() {
      return tabActivationDirection()
    },
  }

  const tabActivationDirection = createMemo((): TabsActivationDirection => {
    const { previousValue, tabActivationDirection: committed } =
      activationDirectionState()
    const currentValue = value()
    const map = tabMap()

    if (previousValue !== currentValue) {
      return computeActivationDirection(
        previousValue,
        currentValue,
        orientation(),
        map,
        tabElements
      )
    }

    return committed
  })

  const selectedTabMetadata = createMemo(() => {
    for (const tabMetadata of tabMap().values()) {
      if (tabMetadata.value === value()) {
        return tabMetadata
      }
    }
    return undefined
  })

  const firstEnabledTabValue = createMemo((): TabsValue | undefined => {
    for (const tabMetadata of tabMap().values()) {
      if (!tabMetadata.disabled) {
        return tabMetadata.value
      }
    }
    return undefined
  })

  createEffect(() => {
    const currentValue = value()
    const { previousValue, tabActivationDirection: committed } =
      activationDirectionState()
    const nextDirection =
      previousValue === currentValue
        ? committed
        : computeActivationDirection(
            previousValue,
            currentValue,
            orientation(),
            tabMap(),
            tabElements
          )

    const directionComputationIncomplete =
      previousValue != null &&
      currentValue != null &&
      getTabElementBySelectedValue(currentValue) == null &&
      previousValue !== currentValue

    const nextPreviousValue = directionComputationIncomplete
      ? previousValue
      : currentValue

    if (previousValue !== nextPreviousValue || committed !== nextDirection) {
      activationDirectionStateAssign({
        previousValue: nextPreviousValue,
        tabActivationDirection: nextDirection,
      })
    }
  })

  createEffect(() => {
    if (isControlled()) return

    const map = tabMap()
    const currentValue = value()
    const selected = selectedTabMetadata()
    const firstEnabled = firstEnabledTabValue()

    function commitAutomaticValueChange(
      fallbackValue: TabsValue,
      fallbackReason: TabsRootChangeEventReason
    ) {
      valueAssign(fallbackValue)
      bumpSelectionVersion()
      activationDirectionStateAssign({
        previousValue: fallbackValue,
        tabActivationDirection: 'none',
      })
      notifyAutomaticValueChange(fallbackValue, fallbackReason)
      shouldNotifyInitialValueChange = false
    }

    if (map.size === 0) {
      if (
        didRegisterTabs &&
        currentValue !== null &&
        lastKnownTabElement != null &&
        !(lastKnownTabElement as Element).isConnected
      ) {
        commitAutomaticValueChange(null, REASONS.missing)
      }
      return
    }

    didRegisterTabs = true
    lastKnownTabElement = map.keys().next().value

    const selectionIsDisabled = selected?.disabled
    const selectionIsMissing = selected == null && currentValue !== null

    if (!selectionIsDisabled && currentValue === initialDefaultValue) {
      shouldHonorDisabledDefaultValue = false
    }

    if (
      shouldHonorDisabledDefaultValue &&
      selectionIsDisabled &&
      currentValue === initialDefaultValue
    ) {
      return
    }

    const shouldNotifyInitial = shouldNotifyInitialValueChange

    if (selectionIsDisabled || selectionIsMissing) {
      const fallbackValue = firstEnabled ?? null

      if (currentValue === fallbackValue) {
        shouldNotifyInitialValueChange = false
        return
      }

      let fallbackReason: TabsRootChangeEventReason = REASONS.missing

      if (shouldNotifyInitial) {
        fallbackReason = REASONS.initial
      } else if (selectionIsDisabled) {
        fallbackReason = REASONS.disabled
      }

      commitAutomaticValueChange(fallbackValue, fallbackReason)
      return
    }

    if (shouldNotifyInitial && selected != null) {
      notifyAutomaticValueChange(currentValue, REASONS.initial)
      shouldNotifyInitialValueChange = false
    }
  })

  const contextValue = {
    value,
    onValueChange,
    orientation,
    getTabElementBySelectedValue,
    registerTabElement,
    getTabIdByPanelValue,
    getTabPanelIdByValue,
    registerMountedTabPanel,
    tabMapAssign,
    tabActivationDirection,
    selectionVersion,
  }

  return (
    <TabsRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={tabPanelRefs}>
        {createRender<TabsRootState, Record<string, unknown>>({
          defaultElement: 'div',
          state,
          render: local.render,
          props: mergeProps(elementProps as Record<string, unknown>, {
            get class() {
              return local.class
            },
            get style() {
              return local.style
            },
            get [TabsRootDataAttributes.activationDirection]() {
              return tabActivationDirection()
            },
            get [TabsRootDataAttributes.orientation]() {
              return orientation()
            },
            ref: local.ref,
          }),
        })}
      </CompositeList>
    </TabsRootContext.Provider>
  )

  /**
   * Layout orientation for the tabs.
   *
   * @returns `'horizontal'` or `'vertical'`.
   */
  function orientation(): Orientation {
    return local.orientation ?? 'horizontal'
  }

  /**
   * Whether selection is controlled via the `value` prop.
   *
   * @returns `true` when `value` is provided.
   */
  function isControlled() {
    return local.value !== undefined
  }

  /**
   * Resolves the DOM node for the selected tab value.
   *
   * @param selectedValue - Tab value to look up.
   * @returns The tab element, or `null` if none is registered.
   */
  function getTabElementBySelectedValue(
    selectedValue: TabsValue
  ): HTMLElement | null {
    return (
      tabElements.get(selectedValue) ?? findTabElement(tabMap(), selectedValue)
    )
  }

  /**
   * Registers or clears the host element for a tab value.
   *
   * @param tabValue - Tab value the element represents.
   * @param element - Mounted host, or `null` on unmount.
   */
  function registerTabElement(
    tabValue: TabsValue,
    element: HTMLElement | null
  ) {
    if (element) tabElements.set(tabValue, element)
    else tabElements.delete(tabValue)
  }

  /**
   * Increments {@link selectionVersion} after a committed selection change.
   */
  function bumpSelectionVersion() {
    selectionVersionAssign(version => version + 1)
  }

  /**
   * Handles a selection change from a tab (or other internal caller).
   *
   * @param newValue - Newly selected tab value.
   * @param eventDetails - Cancelable details; `activationDirection` is filled in.
   */
  function onValueChange(
    newValue: TabsValue,
    eventDetails: TabsRootChangeEventDetails
  ) {
    const activationDirection = computeActivationDirection(
      value(),
      newValue,
      orientation(),
      tabMap(),
      tabElements
    )

    const details = eventDetails
    details.activationDirection = activationDirection

    local.onValueChange?.(newValue, details)
    if (details.isCanceled) return

    valueAssign(newValue)
    bumpSelectionVersion()
  }

  /**
   * Notifies `onValueChange` for automatic (non-user) selection updates.
   *
   * @param nextValue - Value applied automatically.
   * @param reason - Why the automatic change occurred.
   */
  function notifyAutomaticValueChange(
    nextValue: TabsValue,
    reason: TabsRootChangeEventReason
  ) {
    local.onValueChange?.(
      nextValue,
      createChangeEventDetails<
        TabsRootChangeEventReason,
        { activationDirection: TabsActivationDirection }
      >(reason, undefined, undefined, {
        activationDirection: 'none',
      })
    )
  }

  /**
   * Tracks a mounted panel id for `aria-controls` / panel lookup.
   *
   * @param panelValue - Panel value (matches a tab value).
   * @param panelId - DOM id of the panel element.
   * @returns Cleanup that unregisters this panel when it unmounts.
   */
  function registerMountedTabPanel(panelValue: TabsValue, panelId: string) {
    mountedTabPanelsAssign(prev => {
      const next = new Map(prev)
      next.set(panelValue, panelId)
      return next
    })

    return () => {
      mountedTabPanelsAssign(prev => {
        if (prev.get(panelValue) !== panelId) return prev
        const next = new Map(prev)
        next.delete(panelValue)
        return next
      })
    }
  }

  /**
   * Looks up a mounted panel id by tab value.
   *
   * @param tabValue - Tab value whose panel id is needed.
   * @returns Panel id, or `undefined` if no panel is mounted for that value.
   */
  function getTabPanelIdByValue(tabValue: TabsValue) {
    return mountedTabPanels().get(tabValue)
  }

  /**
   * Looks up a tab trigger id by panel value.
   *
   * @param tabPanelValue - Panel value (matches a tab metadata value).
   * @returns Tab id, or `undefined` if none matches.
   */
  function getTabIdByPanelValue(tabPanelValue: TabsValue) {
    for (const tabMetadata of tabMap().values()) {
      if (tabPanelValue === tabMetadata.value) {
        return tabMetadata.id
      }
    }
    return undefined
  }
}
/** Tab value type (any comparable value or `null`). */
export type TabsValue = unknown | null
/** Public state exposed to `render` functions on root parts. */
export interface TabsRootState extends Record<string, unknown> {
  /** Layout orientation of the tabs. */
  orientation: Orientation
  /** Direction of the last tab activation. */
  tabActivationDirection: TabsActivationDirection
}
/** Props for {@link TabsRoot}. */
export type TabsRootProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'defaultValue'
> & {
  /** Controlled selected tab value. */
  value?: TabsValue
  /** Uncontrolled initial selected tab value. @default 0 */
  defaultValue?: TabsValue
  /** Layout orientation. @default 'horizontal' */
  orientation?: Orientation
  /** Called when the selected tab changes (cancelable for user actions).
   *
   * @param value - Newly selected tab value.
   * @param eventDetails - Cancelable details including activation direction.
   */
  onValueChange?: (
    value: TabsValue,
    eventDetails: TabsRootChangeEventDetails
  ) => void
  /** Custom renderer for the root host. */
  render?: RenderProp<TabsRootState, Record<string, unknown>>
}
/** Why a tabs value change occurred. */
export type TabsRootChangeEventReason = Extract<
  ChangeEventReason,
  'none' | 'disabled' | 'missing' | 'initial'
>
/** Cancelable details for {@link TabsRootProps.onValueChange}. */
export type TabsRootChangeEventDetails =
  BaseUIChangeEventDetails<TabsRootChangeEventReason> & {
    /** Direction of the activation relative to the previous tab. */
    activationDirection: TabsActivationDirection
  }
export type { TabsActivationDirection } from '../trigger/TabTrigger'
/**
 * Finds the tab element whose metadata `value` matches `tabValue`.
 *
 * @param map - Composite metadata map from {@link CompositeList}.
 * @param tabValue - Value to look up.
 * @returns The tab element, or `null` if none matches.
 */
function findTabElement(
  map: Map<Node, CompositeMetadata<TabTriggerMetadata>>,
  tabValue: TabsValue
): HTMLElement | null {
  for (const [tabElement, tabMetadata] of map.entries()) {
    if (tabValue === tabMetadata.value) {
      return tabElement as HTMLElement
    }
  }
  return null
}
/**
 * Infers activation direction from old/new tab geometry (or comparable values).
 *
 * @param oldValue - Previously selected tab value.
 * @param newValue - Newly selected tab value.
 * @param layoutOrientation - Horizontal or vertical layout.
 * @param map - Composite metadata map used as a fallback lookup.
 * @param elementsByValue - Registered tab elements keyed by value.
 * @returns `'left' | 'right' | 'up' | 'down' | 'none'`.
 */
function computeActivationDirection(
  oldValue: TabsValue,
  newValue: TabsValue,
  layoutOrientation: Orientation,
  map: Map<Node, CompositeMetadata<TabTriggerMetadata>>,
  elementsByValue: Map<TabsValue, HTMLElement>
): TabsActivationDirection {
  if (oldValue == null || newValue == null) {
    return 'none'
  }

  const [positionProp, backward, forward] =
    layoutOrientation === 'horizontal'
      ? (['left', 'left', 'right'] as const)
      : (['top', 'up', 'down'] as const)

  const oldTab = elementsByValue.get(oldValue) ?? findTabElement(map, oldValue)
  const newTab = elementsByValue.get(newValue) ?? findTabElement(map, newValue)

  if (oldTab == null || newTab == null) {
    if (
      (typeof oldValue === 'number' || typeof oldValue === 'string') &&
      typeof oldValue === typeof newValue
    ) {
      return newValue > oldValue ? forward : backward
    }
    return 'none'
  }

  const oldPosition = oldTab.getBoundingClientRect()[positionProp]
  const newPosition = newTab.getBoundingClientRect()[positionProp]
  const oldOffset =
    layoutOrientation === 'horizontal' ? oldTab.offsetLeft : oldTab.offsetTop
  const newOffset =
    layoutOrientation === 'horizontal' ? newTab.offsetLeft : newTab.offsetTop

  if (newPosition < oldPosition) return backward
  if (newPosition > oldPosition) return forward
  if (newOffset < oldOffset) return backward
  if (newOffset > oldOffset) return forward
  return 'none'
}
