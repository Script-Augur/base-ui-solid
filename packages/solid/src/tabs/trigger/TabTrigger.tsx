import { activeElement, contains } from '@script-augur/base-ui-utils'
import {
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { ACTIVE_COMPOSITE_ITEM } from '../../internals/composite/constants'
import { useCompositeItem } from '../../internals/composite/item/useCompositeItem'
import { useCompositeRootContext } from '../../internals/composite/root/CompositeRootContext'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { dataAttr } from '../../internals/useRender'
import { useTabsListContext } from '../list/TabsListContext'
import { useTabsRootContext } from '../root/TabsRootContext'

import { TabTriggerDataAttributes } from './TabTriggerDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { Orientation } from '../../separator/Separator'
import type { TabsRootState } from '../root/TabsRoot'
import type { JSX } from 'solid-js'

/**
 * An individual tab trigger that selects the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 *
 * @param componentProps - {@link TabTriggerProps} for this instance.
 * @returns The rendered tab button.
 */
export function TabTrigger(componentProps: TabTriggerProps): JSX.Element {
  const root = useTabsRootContext()
  const list = useTabsListContext()
  const compositeRoot = useCompositeRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'value',
    'id',
    'ref',
  ])

  const [tabElement, tabElementAssign] = createSignal<HTMLElement | null>(null)
  const state: TabTriggerState = {
    get disabled() {
      return disabled()
    },
    get active() {
      return isActive()
    },
    get orientation() {
      return root.orientation()
    },
    get tabActivationDirection() {
      return root.tabActivationDirection()
    },
  }

  const generatedId = createUniqueId()
  const { compositeProps, compositeRef, index } = useCompositeItem({
    metadata: tabMetadata,
  })
  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    focusableWhenDisabled: () => true,
    native: () => local.nativeButton ?? true,
    composite: () => true,
    tabIndex: () => compositeProps().tabIndex as number,
  })

  let isNavigating = false
  let isPressing = false
  let isMainButton = false
  let unobserveTabElement: (() => void) | null = null

  createEffect(() => {
    const element = tabElement()
    if (!element) return

    element.tabIndex = compositeProps().tabIndex as number
    const panelId = tabPanelId()
    if (panelId) element.setAttribute('aria-controls', panelId)
    else element.removeAttribute('aria-controls')

    element.setAttribute('aria-selected', isActive() ? 'true' : 'false')
  })

  createEffect(() => {
    if (isNavigating) {
      isNavigating = false
      return
    }

    if (!(
      isActive() &&
      index() > -1 &&
      compositeRoot.highlightedIndex() !== index()
    )) {
      return
    }

    const listElement = list.tabsListElement()
    if (listElement != null) {
      const activeEl = activeElement(listElement.ownerDocument)
      if (activeEl && contains(listElement, activeEl)) {
        return
      }
    }

    if (!disabled()) {
      compositeRoot.onHighlightedIndexChange(index())
    }
  })

  onCleanup(unregisterTab)

  return createRender<TabTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    props: tabProps(),
  })

  function disabled() {
    return local.disabled ?? false
  }

  function id() {
    return local.id ?? generatedId
  }

  function isActive() {
    return local.value === root.value()
  }

  function tabPanelId() {
    return root.getTabPanelIdByValue(local.value)
  }

  function tabMetadata(): TabTriggerMetadata {
    return {
      disabled: disabled(),
      id: id(),
      value: local.value,
    }
  }

  function unregisterTab() {
    root.registerTabElement(local.value, null)
    unobserveTabElement?.()
  }

  function observeTabElement(element: HTMLElement | null) {
    unobserveTabElement?.()
    unobserveTabElement = element
      ? list.registerTabResizeObserverElement(element)
      : null
  }

  function activate(event: Event) {
    root.onValueChange(
      local.value,
      createChangeEventDetails<
        typeof REASONS.none,
        { activationDirection: TabsActivationDirection }
      >(REASONS.none, event, undefined, {
        activationDirection: 'none',
      })
    )
  }

  function handleClick(event: MouseEvent) {
    if (event.button !== 0) return
    if (isActive() || disabled()) return
    activate(event)
  }

  function handleMouseDown(event: MouseEvent) {
    if (isActive() || disabled()) return
    if (list.activateOnFocus() && event.button === 0) {
      activate(event)
    }
  }

  function handleFocus(event: FocusEvent) {
    const onItemFocus = compositeProps().onFocus
    if (typeof onItemFocus === 'function') onItemFocus()
    if (isActive() || disabled()) return
    if (list.activateOnFocus() && (!isPressing || isMainButton)) {
      activate(event)
    }
  }

  function handlePointerDown(event: PointerEvent) {
    const userPointerDown = (
      elementProps as { onPointerDown?: (event: PointerEvent) => void }
    ).onPointerDown
    if (isActive() || disabled()) {
      userPointerDown?.(event)
      return
    }
    isPressing = true
    isMainButton = event.button === 0
    if (list.activateOnFocus() && isMainButton) {
      activate(event)
    }
    userPointerDown?.(event)
    const target = event.currentTarget as HTMLButtonElement
    const doc = target.ownerDocument

    function handlePointerEnd() {
      isPressing = false
      isMainButton = false
      doc.removeEventListener('pointerup', handlePointerEnd)
      doc.removeEventListener('pointercancel', handlePointerEnd)
    }

    doc.addEventListener('pointerup', handlePointerEnd)
    doc.addEventListener('pointercancel', handlePointerEnd)
  }

  function handleKeyDown(event: KeyboardEvent) {
    isNavigating = true
    compositeRoot.onKeyDown(event)
  }

  function handleKeyDownCapture() {
    isNavigating = true
  }

  function setTabRef(element: HTMLElement) {
    tabElementAssign(element)
    buttonRefAssign(element)
    compositeRef(element)
    observeTabElement(element)
    root.registerTabElement(local.value, element)
    const userRef = local.ref
    if (typeof userRef === 'function') {
      userRef(element as HTMLButtonElement)
    }
  }

  function tabProps() {
    return mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          onClick: handleClick,
          onMouseDown: handleMouseDown,
          onFocus: handleFocus,
          onPointerDown: handlePointerDown,
          onKeyDown: handleKeyDown,
          onKeyDownCapture: handleKeyDownCapture,
        }) as Record<string, unknown>
      ),
      {
        role: 'tab',
        get 'aria-controls'() {
          return tabPanelId() ?? undefined
        },
        get 'aria-selected'() {
          return isActive()
        },
        get id() {
          return id()
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get [ACTIVE_COMPOSITE_ITEM]() {
          return isActive() ? '' : undefined
        },
        get [TabTriggerDataAttributes.activationDirection]() {
          return root.tabActivationDirection()
        },
        get [TabTriggerDataAttributes.orientation]() {
          return root.orientation()
        },
        get [TabTriggerDataAttributes.disabled]() {
          return dataAttr(disabled())
        },
        get [TabTriggerDataAttributes.active]() {
          return dataAttr(isActive())
        },
        get tabIndex() {
          return compositeProps().tabIndex
        },
        ref: setTabRef,
      }
    )
  }
}

/** Tab value type (any comparable value or `null`). */
export type TabsValue = unknown | null

/** Direction of a tab activation relative to the previous active tab. */
export type TabsActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none'

/** Bounding box of a tab relative to the list. */
export interface TabsIndicatorPosition {
  /** Distance from the list's left edge. */
  left: number
  /** Distance from the list's right edge. */
  right: number
  /** Distance from the list's top edge. */
  top: number
  /** Distance from the list's bottom edge. */
  bottom: number
}

/** Width and height of a tab. */
export interface TabsIndicatorSize {
  /** Tab width in pixels. */
  width: number
  /** Tab height in pixels. */
  height: number
}

/** Metadata published into the composite map for a tab. */
export interface TabTriggerMetadata {
  /** Whether the tab is disabled. */
  disabled: boolean
  /** Tab element id used for `aria-labelledby` / `aria-controls`. */
  id: string | undefined
  /** Tab value this item represents. */
  value: TabsValue | undefined
}

/** Public state exposed to `render` functions on a tab. */
export interface TabTriggerState extends TabsRootState {
  /** Whether the tab is disabled. */
  disabled: boolean
  /** Whether this tab is selected. */
  active: boolean
}

/** Props for {@link TabTrigger}. */
export type TabTriggerProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled' | 'value'
> & {
  /** Value that selects this tab. */
  value: TabsValue
  /** Whether the tab is disabled. */
  disabled?: boolean
  /** Whether the host is a native `<button>`. @default true */
  nativeButton?: boolean
  /** Custom renderer for the tab host. */
  render?: RenderProp<TabTriggerState, Record<string, unknown>>
}

export type { Orientation }
