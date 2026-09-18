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
import { createTriggerDataForwarding } from '../../internals/popups'
import { useButton } from '../../internals/useButton'
import { useMenuRootContext } from '../root/MenuRootContext'
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext'
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
 *
 * Registers on the **parent** menu list (highlight / typeahead / arrows) and
 * opens the nested {@link MenuRoot} via the nested store (store-first).
 */
export function MenuSubmenuTrigger(
  componentProps: MenuSubmenuTriggerProps
): JSX.Element {
  const submenuRootContext = useMenuSubmenuRootContext()
  if (!submenuRootContext?.parentMenu) {
    throw new Error(
      'Base UI: <Menu.SubmenuTrigger> must be placed in <Menu.SubmenuRoot>.'
    )
  }
  const parentMenu = submenuRootContext.parentMenu
  // Nested MenuRoot that owns the submenu popup (open / trigger registration).
  const nestedContext = useMenuRootContext()

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

  const id = local.id ?? generateId('base-ui-menu-submenu-trigger')
  const [itemElement, itemElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [itemIndex, itemIndexAssign] = createSignal(-1)

  const { registerTrigger } = createTriggerDataForwarding(
    () => id,
    itemElement,
    () => nestedContext.store,
    () => ({})
  )

  const disabled = () =>
    (local.disabled ?? false) ||
    nestedContext.store.select('disabled') ||
    parentMenu.select('disabled')

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? false,
  })

  const openSubmenu = (event: Event) => {
    if (disabled()) return
    nestedContext.setOpen(
      true,
      createChangeEventDetails(
        event instanceof KeyboardEvent
          ? REASONS.listNavigation
          : REASONS.triggerPress,
        event,
        itemElement() ?? undefined
      )
    )
  }

  createEffect(() => {
    const el = itemElement()
    if (!el) return
    const label =
      local.label ??
      (typeof local.children === 'string' ? local.children : el.textContent)

    // Register on the **parent** menu so ArrowDown/Up and typeahead include this item.
    const elements = parentMenu.context.itemDomElements.current
    const labels = parentMenu.context.itemLabels.current
    let index = elements.indexOf(el)
    if (index === -1) {
      index = elements.findIndex(item => item == null)
      if (index === -1) {
        index = elements.length
        elements.push(el)
        labels.push(label)
      } else {
        elements[index] = el
        labels[index] = label
      }
    } else {
      labels[index] = label
    }
    itemIndexAssign(index)

    parentMenu.context.submenuTriggerOpeners.set(el, openSubmenu)

    registerTrigger(el)

    onCleanup(() => {
      const i = elements.indexOf(el)
      if (i !== -1) {
        elements[i] = null
        labels[i] = null
      }
      parentMenu.context.submenuTriggerOpeners.delete(el)
      registerTrigger(null)
    })
  })

  let openTimeout: ReturnType<typeof setTimeout> | undefined
  let closeTimeout: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => {
    if (openTimeout) clearTimeout(openTimeout)
    if (closeTimeout) clearTimeout(closeTimeout)
  })

  const parentActiveIndex = parentMenu.useState('activeIndex')
  const nestedOpen = nestedContext.store.useState('open')
  const isOpen = () => nestedOpen()
  const highlighted = () => {
    const index = itemIndex()
    return index >= 0 && parentActiveIndex() === index
  }
  const popupId = () => {
    const fromTrigger = nestedContext.store.select('triggerPopupId', id)
    if (fromTrigger) return fromTrigger
    // Fallback while popupElement id syncs / activeTriggerId races.
    return isOpen() ? nestedContext.store.select('floatingId') : undefined
  }

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
          get 'aria-disabled'() {
            return disabled() ? true : undefined
          },
          onClick(event: MouseEvent) {
            if (disabled()) return
            nestedContext.setOpen(
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
              nestedContext.setOpen(
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
              if (
                nestedContext.store.select('lastOpenChangeReason') ===
                REASONS.triggerHover
              ) {
                nestedContext.setOpen(
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
            if (!parentMenu.select('highlightItemOnHover') || disabled()) return
            const index = itemIndex()
            if (index >= 0) parentMenu.set('activeIndex', index)
          },
          onBlur() {
            if (highlighted()) {
              parentMenu.set('activeIndex', null)
            }
          },
          onKeyDown(event: KeyboardEvent) {
            if (disabled()) return
            // Vertical menus: ArrowRight / Enter / Space open the submenu from the trigger.
            if (
              event.key === 'ArrowRight' ||
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              event.preventDefault()
              event.stopPropagation()
              openSubmenu(event)
            }
          },
          children: local.children,
          ref(element: HTMLElement) {
            itemElementAssign(element)
            nestedContext.triggerElementAssign(element)
            nestedContext.store.set('activeTriggerElement', element)
            buttonRefAssign(element)
            const userRef = local.ref
            if (typeof userRef === 'function') {
              userRef(element as HTMLDivElement)
            }
          },
        })
      ),
      {
        // Override after useButton so tabIndex / ARIA stay reactive.
        get 'aria-expanded'() {
          return isOpen()
        },
        get 'aria-controls'() {
          return popupId()
        },
        get tabIndex() {
          return isOpen() || highlighted() ? 0 : -1
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
