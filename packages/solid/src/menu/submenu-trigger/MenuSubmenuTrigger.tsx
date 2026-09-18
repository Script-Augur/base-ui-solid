import { generateId } from '@script-augur/base-ui-utils'
import {
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useMenuRootContext } from '../root/MenuRootContext'
import { OPEN_DELAY } from '../utils/constants'
import { itemStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * A menu item that opens a submenu.
 * Renders a `<div>` element with `role="menuitem"`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuSubmenuTrigger(
  componentProps: MenuSubmenuTriggerProps
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
    'openOnHover',
    'delay',
    'closeDelay',
  ])

  // SubmenuTrigger is used inside SubmenuRoot which is a nested MenuRoot.
  // Opening is owned by the nested root's Trigger-like behavior on this item.
  const id = local.id ?? generateId('base-ui-menu-submenu-trigger')
  const [itemElement, itemElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [itemIndex, itemIndexAssign] = createSignal(-1)

  const disabled = () =>
    (local.disabled ?? false) || context.store.select('disabled')

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

  let openTimeout: ReturnType<typeof setTimeout> | undefined
  let closeTimeout: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => {
    if (openTimeout) clearTimeout(openTimeout)
    if (closeTimeout) clearTimeout(closeTimeout)
  })

  const activeIndex = context.store.useState('activeIndex')
  const highlighted = () => {
    const index = itemIndex()
    return index >= 0 && activeIndex() === index
  }
  const isOpen = () => context.open()

  const state: MenuSubmenuTriggerState = {
    get disabled() {
      return disabled()
    },
    get highlighted() {
      return highlighted()
    },
    get open() {
      return isOpen()
    },
  }

  return createRender<MenuSubmenuTriggerState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      itemStateAttributesMapping as StateAttributesMapping<MenuSubmenuTriggerState>,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          id,
          role: 'menuitem',
          'aria-haspopup': 'menu',
          get 'aria-expanded'() {
            return isOpen()
          },
          get tabIndex() {
            return context.open() && highlighted() ? 0 : -1
          },
          get 'aria-disabled'() {
            return disabled() ? true : undefined
          },
          onClick(event: MouseEvent) {
            if (disabled()) return
            context.setOpen(
              true,
              createChangeEventDetails(
                REASONS.triggerPress,
                event,
                itemElement() ?? undefined
              )
            )
          },
          onPointerEnter(event: PointerEvent) {
            if (disabled() || !(local.openOnHover ?? true)) return
            if (event.pointerType === 'touch') return
            if (openTimeout) clearTimeout(openTimeout)
            openTimeout = setTimeout(() => {
              context.setOpen(
                true,
                createChangeEventDetails(
                  REASONS.triggerHover,
                  event,
                  itemElement() ?? undefined
                )
              )
            }, local.delay ?? OPEN_DELAY)
          },
          onPointerLeave(event: PointerEvent) {
            if (disabled() || !(local.openOnHover ?? true)) return
            if (event.pointerType === 'touch') return
            if (closeTimeout) clearTimeout(closeTimeout)
            closeTimeout = setTimeout(() => {
              if (context.store.select('lastOpenChangeReason') === REASONS.triggerHover) {
                context.setOpen(
                  false,
                  createChangeEventDetails(
                    REASONS.triggerHover,
                    event,
                    itemElement() ?? undefined
                  )
                )
              }
            }, local.closeDelay ?? 0)
          },
          onMouseMove() {
            if (!context.highlightItemOnHover() || disabled()) return
            const index = itemIndex()
            if (index >= 0) context.store.set('activeIndex', index)
          },
          children: local.children,
          ref(element: HTMLElement) {
            itemElementAssign(element)
            // Also act as the nested menu's trigger element for positioning.
            context.triggerElementAssign(element)
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
  })
}

/** Public state for {@link MenuSubmenuTrigger}. */
export interface MenuSubmenuTriggerState extends Record<string, unknown> {
  disabled: boolean
  highlighted: boolean
  open: boolean
}

/** Props for {@link MenuSubmenuTrigger}. */
export type MenuSubmenuTriggerProps = JSX.HTMLAttributes<HTMLDivElement> & {
  label?: string
  /**
   * @default false
   */
  nativeButton?: boolean
  disabled?: boolean
  /**
   * Whether the submenu opens on hover.
   * @default true
   */
  openOnHover?: boolean
  /**
   * @default 100
   */
  delay?: number
  /**
   * @default 0
   */
  closeDelay?: number
  render?: RenderProp<MenuSubmenuTriggerState, Record<string, unknown>>
}
