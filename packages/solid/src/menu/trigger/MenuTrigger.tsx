import { generateId } from '@script-augur/base-ui-utils'
import {
  Show,
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { CompositeItem } from '../../internals/composite/item/CompositeItem'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import {
  createPopupHandleStore,
  createTriggerDataForwarding,
} from '../../internals/popups'
import { useButton } from '../../internals/useButton'
import { useMenuRootContext } from '../root/MenuRootContext'
import { OPEN_DELAY } from '../utils/constants'
import { triggerOpenStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { MenuHandle } from '../store/MenuHandle'
import type { JSX } from 'solid-js'

/**
 * A button that opens the menu.
 * Renders a `<button>` element.
 * Inside a Menubar, renders as a composite `role="menuitem"`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function MenuTrigger(componentProps: MenuTriggerProps): JSX.Element {
  const menuRootContext = useMenuRootContext(true)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'openOnHover',
    'delay',
    'closeDelay',
    'ref',
    'id',
    'payload',
    'handle',
  ])

  const handleStore = createPopupHandleStore(local.handle)
  const store = () => handleStore() ?? menuRootContext?.store

  if (!store()) {
    throw new Error(
      'Base UI: <Menu.Trigger> must be used within <Menu.Root> or provided with a handle.'
    )
  }

  const triggerId = local.id ?? generateId('base-ui-menu-trigger')
  const [triggerElement, triggerElementAssign] =
    createSignal<HTMLElement | null>(null)

  const { registerTrigger, isMountedByThisTrigger } =
    createTriggerDataForwarding(
      () => triggerId,
      triggerElement,
      () => store()!,
      () => ({ payload: local.payload })
    )

  const parent = () => store()!.select('parent')
  const isInMenubar = () => parent().type === 'menubar'
  const parentMenubarHasSubmenuOpen = () => {
    const p = parent()
    return p.type === 'menubar' && p.context.hasSubmenuOpen()
  }

  const disabled = () =>
    Boolean(local.disabled ?? store()!.select('disabled'))

  const openOnHover = () =>
    local.openOnHover ?? parentMenubarHasSubmenuOpen()

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
    composite: () => isInMenubar(),
  })

  let openTimeout: ReturnType<typeof setTimeout> | undefined
  let closeTimeout: ReturnType<typeof setTimeout> | undefined

  const clearHoverTimers = () => {
    if (openTimeout) {
      clearTimeout(openTimeout)
    }
    openTimeout = undefined
    if (closeTimeout) {
      clearTimeout(closeTimeout)
    }
    closeTimeout = undefined
  }

  onCleanup(clearHoverTimers)

  const isOpenedByThisTrigger = () =>
    store()!.select('isOpenedByTrigger', triggerId)
  const popupId = () => store()!.select('triggerPopupId', triggerId)
  const isOpen = () => store()!.select('open')

  createEffect(() => {
    if (isMountedByThisTrigger() || menuRootContext) {
      menuRootContext?.triggerElementAssign(triggerElement())
    }
  })

  const state: MenuTriggerState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return isOpenedByThisTrigger()
    },
  }

  const triggerHandlers = {
    id: triggerId,
    'aria-haspopup': 'menu' as const,
    get 'aria-expanded'() {
      return isOpenedByThisTrigger()
    },
    get 'aria-controls'() {
      return popupId()
    },
    onClick(event: MouseEvent) {
      if (disabled()) return
      const activeStore = store()!
      const next = !isOpen()
      activeStore.setOpen(
        next,
        createChangeEventDetails(
          REASONS.triggerPress,
          event,
          triggerElement() ?? undefined
        )
      )
    },
    onFocus(event: FocusEvent) {
      if (disabled() || !parentMenubarHasSubmenuOpen()) return
      if (isOpenedByThisTrigger()) return
      store()!.setOpen(
        true,
        createChangeEventDetails(
          REASONS.triggerFocus,
          event,
          triggerElement() ?? undefined
        )
      )
    },
    onPointerEnter(event: PointerEvent) {
      if (disabled() || !openOnHover()) return
      if (event.pointerType === 'touch') return
      // Menubar: only hover-open when another menu is already open and this
      // trigger is not the one currently mounting the popup.
      if (
        isInMenubar() &&
        (!parentMenubarHasSubmenuOpen() || isMountedByThisTrigger())
      ) {
        return
      }
      clearHoverTimers()
      openTimeout = setTimeout(() => {
        if (!isOpen()) {
          store()!.setOpen(
            true,
            createChangeEventDetails(
              REASONS.triggerHover,
              event,
              triggerElement() ?? undefined
            )
          )
        }
      }, local.delay ?? OPEN_DELAY)
    },
    onPointerLeave(event: PointerEvent) {
      if (disabled() || !openOnHover()) return
      if (event.pointerType === 'touch') return
      if (isInMenubar()) return
      clearHoverTimers()
      closeTimeout = setTimeout(() => {
        const reason = store()!.select('lastOpenChangeReason')
        if (isOpen() && reason === REASONS.triggerHover) {
          store()!.setOpen(
            false,
            createChangeEventDetails(
              REASONS.triggerHover,
              event,
              triggerElement() ?? undefined
            )
          )
        }
      }, local.closeDelay ?? store()!.select('closeDelay'))
    },
    ref(element: HTMLElement) {
      triggerElementAssign(element)
      registerTrigger(element)
      buttonRefAssign(element)
      const userRef = local.ref
      if (typeof userRef === 'function') {
        userRef(element as HTMLButtonElement)
      }
    },
  }

  return (
    <Show
      when={isInMenubar()}
      fallback={createRender<MenuTriggerState, Record<string, unknown>>({
        defaultElement: 'button',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: triggerOpenStateMapping,
        props: mergeProps(
          getButtonProps(
            mergeProps(elementProps as Record<string, unknown>, triggerHandlers)
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
    >
      <CompositeItem<Record<string, never>, MenuTriggerState>
        tag="button"
        render={local.render}
        class={local.class}
        style={local.style}
        state={state}
        stateAttributesMapping={triggerOpenStateMapping}
        refs={[
          el => {
            triggerHandlers.ref(el as HTMLElement)
          },
        ]}
        props={[
          getButtonProps(
            mergeProps(elementProps as Record<string, unknown>, {
              ...triggerHandlers,
              role: 'menuitem',
              // CompositeItem owns tabindex; drop button default.
              ref: undefined,
            })
          ),
        ]}
      />
    </Show>
  )
}

/** Public state for {@link MenuTrigger}. */
export interface MenuTriggerState extends Record<string, unknown> {
  disabled: boolean
  open: boolean
}

/** Props for {@link MenuTrigger}. */
export type MenuTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (e.g. `<div>`).
   * @default true
   */
  nativeButton?: boolean
  /**
   * Whether the menu opens when hovering over the trigger.
   * @default false (true when a sibling menubar menu is open)
   */
  openOnHover?: boolean
  /**
   * How long to wait before opening when `openOnHover` is true (ms).
   * @default 100
   */
  delay?: number
  /**
   * How long to wait before closing when `openOnHover` is true (ms).
   * @default 0
   */
  closeDelay?: number
  /**
   * A handle to associate this trigger with a detached Menu.Root.
   */
  handle?: MenuHandle<unknown>
  /**
   * A payload to pass to the root when this trigger opens the menu.
   */
  payload?: unknown
  render?: RenderProp<MenuTriggerState, Record<string, unknown>>
}
