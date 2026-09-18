import { generateId } from '@script-augur/base-ui-utils'
import { createEffect, createSignal, mergeProps, onCleanup, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext'
import { useMenuRootContext } from '../root/MenuRootContext'
import { itemStateAttributesMapping } from '../utils/stateAttributesMapping'

import { MenuItemDataAttributes } from './MenuItemDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element with `role="menuitem"`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 *
 * @param componentProps - Item props.
 * @returns A Solid JSX element.
 */
export function MenuItem(componentProps: MenuItemProps): JSX.Element {
  const context = useMenuRootContext()
  useMenuPositionerContext(true)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'id',
    'label',
    'nativeButton',
    'disabled',
    'closeOnClick',
  ])

  const id = local.id ?? generateId('base-ui-menu-item')
  const [itemElement, itemElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [itemIndex, itemIndexAssign] = createSignal(-1)

  const disabled = () =>
    (local.disabled ?? false) || context.store.select('disabled')
  const closeOnClick = () => local.closeOnClick ?? true

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? false,
  })

  createEffect(() => {
    const el = itemElement()
    if (!el) return
    const label =
      local.label ??
      (typeof local.children === 'string' ? local.children : el.textContent)
    const unregister = context.registerItem(el, label)
    const index = context.store.context.itemDomElements.current.indexOf(el)
    itemIndexAssign(index)
    onCleanup(unregister)
  })

  const activeIndex = context.store.useState('activeIndex')
  const highlighted = () => {
    const index = itemIndex()
    return index >= 0 && activeIndex() === index
  }

  const state: MenuItemState = {
    get disabled() {
      return disabled()
    },
    get highlighted() {
      return highlighted()
    },
  }

  return createRender<MenuItemState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: itemStateAttributesMapping,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          id,
          role: 'menuitem',
          get 'aria-disabled'() {
            return disabled() ? true : undefined
          },
          get [MenuItemDataAttributes.highlighted]() {
            return highlighted() ? '' : undefined
          },
          onKeyDown(event: KeyboardEvent) {
            if (event.key === ' ' && context.store.context.typingRef.current) {
              event.preventDefault()
            }
          },
          onMouseMove() {
            if (!context.highlightItemOnHover() || disabled()) return
            if (!context.store.select('allowMouseEnter')) return
            const index = itemIndex()
            if (index >= 0) {
              context.store.set('activeIndex', index)
            }
          },
          onClick(event: MouseEvent) {
            if (disabled()) return
            if (closeOnClick()) {
              context.store
                .select('floatingTreeRoot')
                .events.emit('close', {
                  domEvent: event,
                  reason: REASONS.itemPress,
                })
              context.setOpen(
                false,
                createChangeEventDetails(REASONS.itemPress, event)
              )
            }
          },
          children: local.children,
          ref(element: HTMLElement) {
            itemElementAssign(element)
            buttonRefAssign(element)
            const userRef = local.ref
            if (typeof userRef === 'function') {
              userRef(element as HTMLDivElement)
            }
          },
        })
      ),
      {
        get tabIndex() {
          return context.open() && highlighted() ? 0 : -1
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
      }
    ),
  })
}

/** Public state for {@link MenuItem}. */
export interface MenuItemState extends Record<string, unknown> {
  disabled: boolean
  highlighted: boolean
}

/** Props for {@link MenuItem}. */
export type MenuItemProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * The text label for typeahead.
   * Defaults to the text content of the item.
   */
  label?: string
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * @default false
   */
  nativeButton?: boolean
  /**
   * Whether the item closes the menu on click.
   * @default true
   */
  closeOnClick?: boolean
  disabled?: boolean
  render?: RenderProp<MenuItemState, Record<string, unknown>>
}
