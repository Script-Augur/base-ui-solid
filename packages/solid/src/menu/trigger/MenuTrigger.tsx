import { generateId } from '@script-augur/base-ui-utils'
import {
  Show,
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { useCompositeItem } from '../../internals/composite/item/useCompositeItem'
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
import type { MenuHandleStore } from '../store/MenuStore'
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

  createEffect(() => {
    if (isMountedByThisTrigger() || menuRootContext) {
      menuRootContext?.triggerElementAssign(triggerElement())
    }
  })

  const activeStore = store()!
  const shared: MenuTriggerShared = {
    local,
    elementProps: elementProps,
    store: () => activeStore,
    triggerId,
    triggerElement,
    triggerElementAssign,
    registerTrigger,
    isMountedByThisTrigger,
    menuRootContext,
  }

  return (
    <Show
      when={isInMenubar()}
      fallback={<MenuTriggerStandalone {...shared} />}
    >
      <MenuTriggerMenubarItem {...shared} />
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
/**
 * Standalone (non-menubar) trigger via {@link createRender}.
 *
 * @param props - Shared trigger wiring.
 * @returns Trigger button.
 */
function MenuTriggerStandalone(props: MenuTriggerShared): JSX.Element {
  const handlers = createTriggerHandlers(props, { menubar: false })
  const { getButtonProps, buttonRefAssign } = useButton({
    disabled: handlers.disabled,
    native: () => props.local.nativeButton ?? true,
  })

  return createRender<MenuTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state: handlers.state,
    render: props.local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: triggerOpenStateMapping,
    props: mergeProps(
      getButtonProps(
        mergeProps(props.elementProps, {
          ...handlers.dom,
          ref(element: HTMLElement) {
            handlers.dom.ref(element)
            buttonRefAssign(element)
          },
        })
      ),
      {
        get class() {
          return props.local.class
        },
        get style() {
          return props.local.style
        },
      }
    ),
  })
}
/**
 * Menubar trigger: composite roving tabindex + chained focus open.
 * Uses {@link useCompositeItem} (not {@link CompositeItem}) so menubar
 * `onFocus` open is not overwritten by composite highlight `onFocus`.
 *
 * @param props - Shared trigger wiring.
 * @returns Menuitem trigger button.
 */
function MenuTriggerMenubarItem(props: MenuTriggerShared): JSX.Element {
  const handlers = createTriggerHandlers(props, { menubar: true })
  const { compositeProps, compositeRef } = useCompositeItem()
  const { getButtonProps, buttonRefAssign } = useButton({
    disabled: handlers.disabled,
    native: () => props.local.nativeButton ?? true,
    composite: () => true,
  })

  return createRender<MenuTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state: handlers.state,
    render: props.local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: triggerOpenStateMapping,
    props: mergeProps(
      getButtonProps(
        mergeProps(props.elementProps, {
          ...handlers.dom,
          role: 'menuitem',
          get tabIndex() {
            return compositeProps().tabIndex
          },
          onFocus(event: FocusEvent) {
            const compositeFocus = compositeProps().onFocus as
              | ((e: FocusEvent) => void)
              | undefined
            compositeFocus?.(event)
            handlers.dom.onFocus(event)
          },
          onMouseMove(event: MouseEvent) {
            const compositeMove = compositeProps().onMouseMove as
              | ((e: MouseEvent) => void)
              | undefined
            compositeMove?.(event)
          },
          ref(element: HTMLElement) {
            compositeRef(element)
            handlers.dom.ref(element)
            buttonRefAssign(element)
          },
        })
      ),
      {
        get class() {
          return props.local.class
        },
        get style() {
          return props.local.style
        },
      }
    ),
  })
}
/**
 * Builds disabled/open helpers and DOM handlers shared by both trigger paths.
 *
 * @param props - Shared trigger wiring.
 * @param options - Whether this path is inside a Menubar.
 * @returns State, disabled accessor, and DOM handler bag.
 */
function createTriggerHandlers(
  props: MenuTriggerShared,
  options: { menubar: boolean }
) {
  const parentMenubarHasSubmenuOpen = () => {
    const p = props.store().select('parent')
    return p.type === 'menubar' && p.context.hasSubmenuOpen()
  }

  const disabled = () =>
    Boolean(props.local.disabled ?? props.store().select('disabled'))

  const openOnHover = () =>
    props.local.openOnHover ?? parentMenubarHasSubmenuOpen()

  const isOpenedByThisTrigger = () =>
    props.store().select('isOpenedByTrigger', props.triggerId)
  const popupId = () =>
    props.store().select('triggerPopupId', props.triggerId)
  const isOpen = () => props.store().select('open')

  let openTimeout: ReturnType<typeof setTimeout> | undefined
  let closeTimeout: ReturnType<typeof setTimeout> | undefined

  const clearHoverTimers = () => {
    if (openTimeout) clearTimeout(openTimeout)
    openTimeout = undefined
    if (closeTimeout) clearTimeout(closeTimeout)
    closeTimeout = undefined
  }

  onCleanup(clearHoverTimers)

  const state: MenuTriggerState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return isOpenedByThisTrigger()
    },
  }

  const dom = {
    id: props.triggerId,
    'aria-haspopup': 'menu' as const,
    get 'aria-expanded'() {
      return isOpenedByThisTrigger()
    },
    get 'aria-controls'() {
      return popupId()
    },
    onClick(event: MouseEvent) {
      if (disabled()) return
      const activeStore = props.store()
      const next = !isOpen()
      activeStore.setOpen(
        next,
        createChangeEventDetails(
          REASONS.triggerPress,
          event,
          props.triggerElement() ?? undefined
        )
      )
    },
    onFocus(event: FocusEvent) {
      if (disabled() || !parentMenubarHasSubmenuOpen()) return
      if (isOpenedByThisTrigger()) return
      props.store().setOpen(
        true,
        createChangeEventDetails(
          REASONS.triggerFocus,
          event,
          props.triggerElement() ?? undefined
        )
      )
    },
    onPointerEnter(event: PointerEvent) {
      if (disabled() || !openOnHover()) return
      if (event.pointerType === 'touch') return
      if (
        options.menubar &&
        (!parentMenubarHasSubmenuOpen() || props.isMountedByThisTrigger())
      ) {
        return
      }
      clearHoverTimers()
      openTimeout = setTimeout(() => {
        if (!isOpen()) {
          props.store().setOpen(
            true,
            createChangeEventDetails(
              REASONS.triggerHover,
              event,
              props.triggerElement() ?? undefined
            )
          )
        }
      }, props.local.delay ?? OPEN_DELAY)
    },
    onPointerLeave(event: PointerEvent) {
      if (disabled() || !openOnHover()) return
      if (event.pointerType === 'touch') return
      if (options.menubar) return
      clearHoverTimers()
      closeTimeout = setTimeout(() => {
        const reason = props.store().select('lastOpenChangeReason')
        if (isOpen() && reason === REASONS.triggerHover) {
          props.store().setOpen(
            false,
            createChangeEventDetails(
              REASONS.triggerHover,
              event,
              props.triggerElement() ?? undefined
            )
          )
        }
      }, props.local.closeDelay ?? props.store().select('closeDelay'))
    },
    ref(element: HTMLElement) {
      props.triggerElementAssign(element)
      props.registerTrigger(element)
      const userRef = props.local.ref
      if (typeof userRef === 'function') {
        userRef(element as HTMLButtonElement)
      }
    },
  }

  return { disabled, state, dom }
}
/** Shared wiring for standalone vs menubar trigger paths. */
type MenuTriggerShared = {
  local: {
    render?: RenderProp<MenuTriggerState, Record<string, unknown>>
    class?: string
    style?: JSX.CSSProperties | string
    disabled?: boolean
    nativeButton?: boolean
    openOnHover?: boolean
    delay?: number
    closeDelay?: number
    ref?: HTMLButtonElement | ((el: HTMLButtonElement) => void)
  }
  elementProps: Record<string, unknown>
  store: () => MenuHandleStore
  triggerId: string
  triggerElement: () => HTMLElement | null
  triggerElementAssign: (el: HTMLElement | null) => void
  registerTrigger: (el: HTMLElement | null) => void
  isMountedByThisTrigger: () => boolean
  menuRootContext: ReturnType<typeof useMenuRootContext>
}
