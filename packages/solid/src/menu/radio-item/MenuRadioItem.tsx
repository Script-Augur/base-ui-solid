import { generateId } from '@script-augur/base-ui-utils'
import {
  createContext,
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
  useContext,
} from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useMenuRadioGroupContext } from '../radio-group/MenuRadioGroup'
import { useMenuRootContext } from '../root/MenuRootContext'
import { checkedStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'
/**
 * Context for radio item checked state (indicator).
 */
export const MenuRadioItemContext = createContext<MenuRadioItemContextValue>()
/**
 * A menu item that selects a value from a radio group.
 * Renders a `<div>` with `role="menuitemradio"`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuRadioItem(componentProps: MenuRadioItemProps): JSX.Element {
  const context = useMenuRootContext()
  const group = useMenuRadioGroupContext()

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
    'value',
    'closeOnClick',
  ])

  const id = local.id ?? generateId('base-ui-menu-radio-item')
  const [itemElement, itemElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [itemIndex, itemIndexAssign] = createSignal(-1)

  const disabled = () =>
    (local.disabled ?? false) ||
    group.disabled() ||
    context.store.select('disabled')
  const closeOnClick = () => local.closeOnClick ?? false
  const checked = () => group.value() === local.value

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
    itemIndexAssign(context.store.context.itemDomElements.current.indexOf(el))
    onCleanup(unregister)
  })

  const activeIndex = context.store.useState('activeIndex')
  const highlighted = () => {
    const index = itemIndex()
    return index >= 0 && activeIndex() === index
  }

  const select = (event: Event) => {
    if (disabled()) return
    const details = createChangeEventDetails(REASONS.itemPress, event)
    group.onValueChange?.(local.value, details)
    if (details.isCanceled) return
    group.valueAssign(local.value)
    if (closeOnClick()) {
      context.setOpen(false, details)
    }
  }

  const state: MenuRadioItemState = {
    get checked() {
      return checked()
    },
    get disabled() {
      return disabled()
    },
    get highlighted() {
      return highlighted()
    },
  }

  return (
    <MenuRadioItemContext.Provider value={{ checked, disabled }}>
      {createRender<MenuRadioItemState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: checkedStateAttributesMapping,
        props: mergeProps(
          getButtonProps(
            mergeProps(elementProps as Record<string, unknown>, {
              id,
              role: 'menuitemradio',
              get 'aria-checked'() {
                return checked()
              },
              get tabIndex() {
                return context.open() && highlighted() ? 0 : -1
              },
              get 'aria-disabled'() {
                return disabled() ? true : undefined
              },
              onClick(event: MouseEvent) {
                select(event)
              },
              onMouseMove() {
                if (!context.highlightItemOnHover() || disabled()) return
                const index = itemIndex()
                if (index >= 0) context.store.set('activeIndex', index)
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
            get class() {
              return local.class
            },
            get style() {
              return local.style
            },
          }
        ),
      })}
    </MenuRadioItemContext.Provider>
  )
}
/**
 * Reads radio item context.
 */
export function useMenuRadioItemContext(): MenuRadioItemContextValue {
  const ctx = useContext(MenuRadioItemContext)
  if (!ctx) {
    throw new Error(
      'Base UI: Menu.RadioItemIndicator must be used within Menu.RadioItem.'
    )
  }
  return ctx
}
/** Context value for radio item. */
export type MenuRadioItemContextValue = {
  checked: () => boolean
  disabled: () => boolean
}
/** Public state for {@link MenuRadioItem}. */
export interface MenuRadioItemState extends Record<string, unknown> {
  checked: boolean
  disabled: boolean
  highlighted: boolean
}
/** Props for {@link MenuRadioItem}. */
export type MenuRadioItemProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /** Required value for this radio item. */
  value: unknown
  label?: string
  /**
   * @default false
   */
  nativeButton?: boolean
  disabled?: boolean
  /**
   * @default false
   */
  closeOnClick?: boolean
  render?: RenderProp<MenuRadioItemState, Record<string, unknown>>
}
