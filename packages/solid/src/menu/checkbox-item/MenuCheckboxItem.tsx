import { generateId } from '@script-augur/base-ui-utils'
import { createContext, createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
  useContext } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useMenuRootContext } from '../root/MenuRootContext'
import { checkedStateAttributesMapping } from '../utils/stateAttributesMapping'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'
/**
 * Context for checkbox item checked state (indicator).
 */
export const MenuCheckboxItemContext =
  createContext<MenuCheckboxItemContextValue>()
/**
 * A menu item that toggles a boolean.
 * Renders a `<div>` with `role="menuitemcheckbox"`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuCheckboxItem(
  componentProps: MenuCheckboxItemProps
): JSX.Element {
  const context = useMenuRootContext()

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
    'checked',
    'defaultChecked',
    'onCheckedChange',
    'closeOnClick',
  ])

  const [checked, checkedAssign] = createControlled({
    value: () => local.checked,
    defaultValue: local.defaultChecked ?? false,
  })

  // Ensure uncontrolled updates always write the internal signal (Solid set
  // accepts a value; avoid updater-form ambiguity for boolean false).
  const setChecked = (next: boolean) => {
    checkedAssign(next)
  }

  const id = local.id ?? generateId('base-ui-menu-checkbox-item')
  const [itemElement, itemElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [itemIndex, itemIndexAssign] = createSignal(-1)

  const disabled = () =>
    (local.disabled ?? false) || context.store.select('disabled')
  const closeOnClick = () => local.closeOnClick ?? false

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

  const toggle = (event: Event) => {
    if (disabled()) return
    const next = !checked()
    const details = createChangeEventDetails(REASONS.itemPress, event)
    local.onCheckedChange?.(next, details)
    if (details.isCanceled) return
    setChecked(next)
    if (closeOnClick()) {
      context.setOpen(false, details)
    }
  }

  const state: MenuCheckboxItemState = {
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
    <MenuCheckboxItemContext.Provider
      value={{
        checked,
        disabled,
      }}
    >
      {createRender<MenuCheckboxItemState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: checkedStateAttributesMapping,
        props: mergeProps(
          getButtonProps(
            mergeProps(elementProps as Record<string, unknown>, {
              id,
              role: 'menuitemcheckbox',
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
                toggle(event)
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
    </MenuCheckboxItemContext.Provider>
  )
}
/**
 * Reads checkbox item context.
 */
export function useMenuCheckboxItemContext(): MenuCheckboxItemContextValue {
  const ctx = useContext(MenuCheckboxItemContext)
  if (!ctx) {
    throw new Error(
      'Base UI: Menu.CheckboxItemIndicator must be used within Menu.CheckboxItem.'
    )
  }
  return ctx
}
/** Context value for checkbox item. */
export type MenuCheckboxItemContextValue = {
  checked: () => boolean
  disabled: () => boolean
}
/** Public state for {@link MenuCheckboxItem}. */
export interface MenuCheckboxItemState extends Record<string, unknown> {
  checked: boolean
  disabled: boolean
  highlighted: boolean
}
/** Props for {@link MenuCheckboxItem}. */
export type MenuCheckboxItemProps = JSX.HTMLAttributes<HTMLDivElement> & {
  label?: string
  /**
   * @default false
   */
  nativeButton?: boolean
  disabled?: boolean
  checked?: boolean
  /**
   * @default false
   */
  defaultChecked?: boolean
  onCheckedChange?: (
    checked: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
  /**
   * @default false
   */
  closeOnClick?: boolean
  render?: RenderProp<MenuCheckboxItemState, Record<string, unknown>>
}
