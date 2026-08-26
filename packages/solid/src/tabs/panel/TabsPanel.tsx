import { inertValue } from '@script-augur/base-ui-utils'
import {
  Show,
  createEffect,
  createUniqueId,
  mergeProps,
  splitProps,
} from 'solid-js'

import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem'
import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useTabsRootContext } from '../root/TabsRootContext'

import { TabsPanelDataAttributes } from './TabsPanelDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TabsRootState } from '../root/TabsRoot'
import type { TabsValue } from '../trigger/TabTrigger'
import type { JSX } from 'solid-js'

/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 *
 * @param componentProps - {@link TabsPanelProps} for this instance.
 * @returns The rendered tab panel element.
 */
export function TabsPanel(componentProps: TabsPanelProps): JSX.Element {
  const root = useTabsRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'value',
    'keepMounted',
    'ref',
  ])

  const keepMounted = () => local.keepMounted ?? false
  const id = createUniqueId()

  const { refAssign, index } = useCompositeListItem()

  const open = () => local.value === root.value()
  const hidden = () => !open()
  const correspondingTabId = () => root.getTabIdByPanelValue(local.value)

  const shouldRender = () => keepMounted() || open()

  const state: TabsPanelState = {
    get hidden() {
      return hidden()
    },
    get orientation() {
      return root.orientation()
    },
    get tabActivationDirection() {
      return root.tabActivationDirection()
    },
  }

  return (
    <Show when={shouldRender()}>
      <TabsPanelRegistration panelId={id} panelValue={local.value} />
      {createRender<TabsPanelState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get 'aria-labelledby'() {
            return correspondingTabId()
          },
          get hidden() {
            return hidden()
          },
          get id() {
            return id
          },
          role: 'tabpanel',
          get tabIndex() {
            return open() ? 0 : -1
          },
          get inert() {
            return inertValue(!open())
          },
          get [TabsPanelDataAttributes.index]() {
            return String(index())
          },
          get [TabsPanelDataAttributes.activationDirection]() {
            return root.tabActivationDirection()
          },
          get [TabsPanelDataAttributes.orientation]() {
            return root.orientation()
          },
          get [TabsPanelDataAttributes.hidden]() {
            return dataAttr(hidden())
          },
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          ref(element: HTMLElement) {
            refAssign(element)
            const userRef = local.ref
            if (typeof userRef === 'function') {
              userRef(element as HTMLDivElement)
            }
          },
        }),
      })}
    </Show>
  )
}
/** Public state exposed to `render` functions on the panel. */
export interface TabsPanelState extends TabsRootState {
  /** Whether this panel is not the selected tab. */
  hidden: boolean
}

/** Props for {@link TabsPanel}. */
export type TabsPanelProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /** Tab value this panel corresponds to. */
  value: TabsValue
  /** Whether to keep the panel in the DOM while hidden. @default false */
  keepMounted?: boolean
  /** Custom renderer for the panel host. */
  render?: RenderProp<TabsPanelState, Record<string, unknown>>
}

/**
 * Registers this panel's id with the tabs root for `aria-controls`.
 *
 * @param props - Panel id and associated tab value.
 * @returns `null` (side-effect only).
 */
function TabsPanelRegistration(props: {
  panelId: string
  panelValue: TabsValue
}) {
  const root = useTabsRootContext()
  createEffect(() =>
    root.registerMountedTabPanel(props.panelValue, props.panelId)
  )
  return null
}
