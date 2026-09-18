import { generateId } from '@script-augur/base-ui-utils'
import { createEffect, createSignal, onCleanup, splitProps } from 'solid-js'

import { CompositeRoot } from '../internals/composite/root/CompositeRoot'
import {
  REASONS,
} from '../internals/createChangeEventDetails'
import { FloatingTreeStore } from '../internals/popups'

import { MenubarContext } from './MenubarContext'
import { MenubarDataAttributes } from './MenubarDataAttributes'

import type { MenubarContextValue } from './MenubarContext'
import type { RenderProp } from '../internals/createRender'
import type { StateAttributesMapping } from '../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

const menubarStateAttributesMapping = {
  hasSubmenuOpen(value: boolean) {
    return value
      ? { [MenubarDataAttributes.hasSubmenuOpen]: '' }
      : null
  },
  modal(value: boolean) {
    return value ? { [MenubarDataAttributes.modal]: '' } : null
  },
} as StateAttributesMapping<MenubarState>

/**
 * The container for menus.
 * Renders a `<div>` element with `role="menubar"`.
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 *
 * @param componentProps - Menubar props.
 * @returns A Solid JSX element wrapping nested Menu roots.
 */
export function Menubar(componentProps: MenubarProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'id',
    'orientation',
    'loopFocus',
    'modal',
    'disabled',
  ])

  const orientation = () => local.orientation ?? 'horizontal'
  const loopFocus = () => local.loopFocus ?? true
  const modal = () => local.modal ?? true
  const disabled = () => local.disabled ?? false

  const [contentElement, contentElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [hasSubmenuOpen, hasSubmenuOpenAssign] = createSignal(false)

  const rootId = local.id ?? generateId('base-ui-menubar')
  const floatingNodeId = generateId('base-ui-menubar-node')
  const floatingTreeRoot = new FloatingTreeStore()
  const allowMouseUpTriggerRef = { current: false }

  // Register the menubar as the root floating node (parent of top-level menus).
  const menubarNode = { id: floatingNodeId, parentId: null as string | null }
  floatingTreeRoot.addNode(menubarNode)
  onCleanup(() => {
    floatingTreeRoot.removeNode(menubarNode)
  })

  createEffect(() => {
    function onSubmenuOpenChange(details: unknown) {
      const payload = details as {
        open?: boolean
        nodeId?: string
        parentNodeId?: string | null
        reason?: string
      }
      if (!payload.nodeId || payload.parentNodeId !== floatingNodeId) {
        return
      }
      if (payload.open) {
        if (!hasSubmenuOpen()) {
          hasSubmenuOpenAssign(true)
        }
      } else if (
        payload.reason !== REASONS.siblingOpen &&
        payload.reason !== REASONS.listNavigation
      ) {
        hasSubmenuOpenAssign(false)
      }
    }
    floatingTreeRoot.events.on('menuopenchange', onSubmenuOpenChange)
    onCleanup(() => {
      floatingTreeRoot.events.off('menuopenchange', onSubmenuOpenChange)
    })
  })

  const state: MenubarState = {
    get orientation() {
      return orientation()
    },
    get modal() {
      return modal()
    },
    get hasSubmenuOpen() {
      return hasSubmenuOpen()
    },
  }

  const contextValue: MenubarContextValue = {
    get modal() {
      return modal()
    },
    get disabled() {
      return disabled()
    },
    contentElement,
    contentElementAssign,
    hasSubmenuOpen,
    hasSubmenuOpenAssign,
    get orientation() {
      return orientation()
    },
    allowMouseUpTriggerRef,
    rootId,
    floatingTreeRoot,
    floatingNodeId,
  }

  return (
    <MenubarContext.Provider value={contextValue}>
      <CompositeRoot<Record<string, never>, MenubarState>
        render={local.render}
        class={local.class}
        style={local.style}
        state={state}
        stateAttributesMapping={menubarStateAttributesMapping}
        refs={[el => contentElementAssign(el), setUserRef]}
        props={[
          {
            role: 'menubar',
            id: rootId,
            get 'aria-orientation'() {
              return orientation()
            },
          },
          elementProps,
        ]}
        orientation={orientation}
        loopFocus={loopFocus}
        enableHomeAndEndKeys
        highlightItemOnHover={hasSubmenuOpen()}
        tag="div"
      >
        {local.children}
      </CompositeRoot>
    </MenubarContext.Provider>
  )

  /**
   * Forwards the host element to the consumer `ref` prop.
   *
   * @param el - Mounted menubar element, or `null` on unmount.
   */
  function setUserRef(el: HTMLElement | null) {
    const userRef = local.ref
    if (typeof userRef === 'function') {
      userRef(el as HTMLDivElement)
    }
  }
}

/** Public state for {@link Menubar}. */
export interface MenubarState extends Record<string, unknown> {
  /**
   * The orientation of the menubar.
   */
  orientation: 'horizontal' | 'vertical'
  /**
   * Whether the menubar is modal.
   */
  modal: boolean
  /**
   * Whether any submenu within the menubar is open.
   */
  hasSubmenuOpen: boolean
}

/** Props for {@link Menubar}. */
export type MenubarProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'id'
> & {
  /**
   * Whether the menubar is modal.
   * @default true
   */
  modal?: boolean
  /**
   * Whether the whole menubar is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * The orientation of the menubar.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached while using the arrow keys.
   * @default true
   */
  loopFocus?: boolean
  id?: string
  render?: RenderProp<MenubarState, Record<string, unknown>>
}
