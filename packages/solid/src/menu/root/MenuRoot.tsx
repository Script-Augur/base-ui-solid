import { contains, generateId, getTarget } from '@script-augur/base-ui-utils'
import {
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { createDismiss } from '../../internals/dismiss'
import { createFocusTrap } from '../../internals/focusTrap'
import { listenerEffect } from '../../internals/listenerEffect'
import {
  attachPreventUnmountOnClose,
  createActiveTriggerElementSync,
  createImplicitActiveTrigger,
  createPopupFloatingRootContext,
  createPopupHandleAttachment,
  isEventOnPopupTrigger,
  setPopupOpenState,
} from '../../internals/popups'
import { createScrollLock } from '../../internals/scrollLock'
import { MenuStore } from '../store/MenuStore'
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext'
import { TYPEAHEAD_RESET_MS } from '../utils/constants'

import { MenuRootContext, useMenuRootContext } from './MenuRootContext'

import type { MenuRootContextValue } from './MenuRootContext'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { FloatingOpenChangeDetails } from '../../internals/popups'
import type { MenuHandle } from '../store/MenuHandle'
import type { MenuParent } from '../utils/types'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of the menu.
 * Doesn't render its own HTML element.
 *
 * Open pipeline is **store-first** (see `internals/popups/OPEN_PIPELINE.md`):
 * `MenuStore.setOpen` emits on `floatingRootContext`; this Root listens and
 * commits open state. Do **not** overwrite `store.setOpen` with a
 * `createControlled` bridge.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 *
 * @param componentProps - Root props.
 * @returns Children wrapped in menu context.
 */
export function MenuRoot(componentProps: MenuRootProps): JSX.Element {
  const [local] = splitProps(componentProps, [
    'children',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onOpenChangeComplete',
    'disabled',
    'modal',
    'loopFocus',
    'orientation',
    'actionsRef',
    'closeParentOnEsc',
    'handle',
    'triggerId',
    'defaultTriggerId',
    'highlightItemOnHover',
  ])

  const parentMenuRootContext = useMenuRootContext(true)
  const submenuContext = useMenuSubmenuRootContext()
  const isSubmenu = () => submenuContext != null

  const parentFromContext = (): MenuParent => {
    if (isSubmenu() && parentMenuRootContext) {
      return {
        type: 'menu',
        store: parentMenuRootContext.store,
      }
    }
    return { type: undefined }
  }

  const store = new MenuStore({
    open: local.defaultOpen ?? false,
    openProp: local.open,
    activeTriggerId: local.defaultTriggerId ?? null,
    triggerIdProp: local.triggerId,
    parent: parentFromContext(),
    disabled: local.disabled ?? false,
    highlightItemOnHover: local.highlightItemOnHover ?? true,
    modal:
      parentFromContext().type === undefined ? (local.modal ?? true) : true,
  })

  createPopupHandleAttachment(local.handle, store)
  createImplicitActiveTrigger(store)

  const floatingId = generateId('base-ui-menu')
  const rootId = generateId('base-ui-menu-root')
  const portalId = generateId('base-ui-menu-portal')

  const floatingRoot = createPopupFloatingRootContext(
    store.context.triggerElements,
    floatingId,
    parentFromContext().type !== undefined
  )
  store.set('floatingRootContext', floatingRoot)
  store.set('floatingId', floatingId)
  store.set('rootId', rootId)

  createEffect(() => {
    store.set('openProp', local.open)
  })
  createEffect(() => {
    store.set('triggerIdProp', local.triggerId)
  })
  createEffect(() => {
    store.set('disabled', local.disabled ?? false)
  })
  createEffect(() => {
    store.set('highlightItemOnHover', local.highlightItemOnHover ?? true)
  })
  createEffect(() => {
    store.set('parent', parentFromContext())
  })
  createEffect(() => {
    if (parentFromContext().type === undefined) {
      store.set('modal', local.modal ?? true)
    }
  })
  createEffect(() => {
    store.context.onOpenChange = local.onOpenChange
    store.context.onOpenChangeComplete = local.onOpenChangeComplete
  })
  onCleanup(() => store.dispose())

  const open = store.useState('open')
  const { mounted, mountedAssign, transitionStatus } =
    createTransitionStatus(open)

  const [popupElement, popupElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [positionerElement, positionerElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [viewportElement, viewportElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [triggerElement, triggerElementAssign] =
    createSignal<HTMLElement | null>(null)
  createActiveTriggerElementSync(store, triggerElementAssign)
  const [backdropElement, backdropElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [internalBackdropElement, internalBackdropElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [arrowElement, arrowElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [preventUnmountOnClose, preventUnmountOnCloseAssign] =
    createSignal(false)
  const [popupFinalFocus, popupFinalFocusAssign] = createSignal<
    boolean | HTMLElement | null | undefined
  >(undefined)

  const nested = () => store.select('floatingParentNodeId') != null
  const modal = () => Boolean(store.select('modal'))
  const orientation = () => local.orientation ?? 'vertical'
  const loopFocus = () => local.loopFocus ?? true
  const highlightItemOnHover = () => local.highlightItemOnHover ?? true

  const setOpen = (
    nextOpen: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => {
    const reason = eventDetails.reason
    if (!nextOpen && !store.select('open')) {
      return
    }
    const activeTriggerElement = store.select('activeTriggerElement')
    const lastReason = store.select('lastOpenChangeReason')
    if (
      open() === nextOpen &&
      eventDetails.trigger === activeTriggerElement &&
      lastReason === reason
    ) {
      return
    }

    const shouldPreventUnmountOnClose = attachPreventUnmountOnClose(
      eventDetails as unknown as { preventUnmountOnClose: () => void }
    )
    ;(eventDetails as MenuRootChangeEventDetails).preventUnmountOnClose =
      () => {
        preventUnmountOnCloseAssign(true)
        store.set('preventUnmountingOnClose', true)
      }

    if (!nextOpen && eventDetails.trigger == null) {
      eventDetails.trigger = activeTriggerElement ?? undefined
    }

    local.onOpenChange?.(nextOpen, eventDetails)
    if (eventDetails.isCanceled) {
      return
    }

    store.state.floatingRootContext!.dispatchOpenChange(
      nextOpen,
      eventDetails as unknown as FloatingOpenChangeDetails
    )

    const nativeEvent = eventDetails.event
    const isKeyboardClick =
      (reason === REASONS.triggerPress || reason === REASONS.itemPress) &&
      nativeEvent instanceof MouseEvent &&
      nativeEvent.detail === 0
    const isDismissClose =
      !nextOpen && (reason === REASONS.escapeKey || reason === REASONS.none)

    const updatedState: {
      open: boolean
      openChangeReason: ChangeEventReason | null
      mounted?: boolean
      activeTriggerId?: string | null
      activeTriggerElement?: Element | null
    } = {
      open: nextOpen,
      openChangeReason: reason,
    }
    setPopupOpenState(
      updatedState,
      nextOpen,
      eventDetails.trigger,
      shouldPreventUnmountOnClose()
    )
    store.update(updatedState)

    if (isKeyboardClick || isDismissClose) {
      store.set('instantType', isKeyboardClick ? 'click' : 'dismiss')
    } else {
      store.set('instantType', undefined)
    }
  }

  // Store-first: listen for `setOpen` emits from MenuStore / handle (do not overwrite store.setOpen).
  createEffect(() => {
    const floating = store.state.floatingRootContext
    if (!floating) return
    const handleSetOpenEvent = (data: unknown) => {
      const payload = data as {
        open: boolean
        eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
      }
      setOpen(payload.open, payload.eventDetails)
    }
    floating.context.events.on('setOpen', handleSetOpenEvent)
    floating.context.onOpenChange = setOpen as unknown as (
      open: boolean,
      eventDetails: FloatingOpenChangeDetails
    ) => void
    onCleanup(() => {
      floating.context.events.off('setOpen', handleSetOpenEvent)
    })
  })

  // Tree close events (item press / submenu).
  createEffect(() => {
    const tree = store.select('floatingTreeRoot')
    const handleClose = (data: unknown) => {
      const payload = data as { domEvent?: Event; reason?: ChangeEventReason }
      setOpen(
        false,
        createChangeEventDetails(
          payload.reason ?? REASONS.itemPress,
          payload.domEvent
        )
      )
    }
    tree.events.on('close', handleClose)
    onCleanup(() => {
      tree.events.off('close', handleClose)
    })
  })

  const handleUnmount = () => {
    mountedAssign(false)
    store.set('openChangeReason', null)
    store.set('activeIndex', null)
    store.set('allowMouseEnter', false)
    local.onOpenChangeComplete?.(false)
  }

  createOpenChangeComplete({
    open,
    element: popupElement,
    enabled: () => !preventUnmountOnClose(),
    onComplete() {
      if (!open()) {
        handleUnmount()
      } else {
        local.onOpenChangeComplete?.(true)
      }
    },
  })

  createEffect(() => {
    const actions = local.actionsRef
    if (!actions) return
    actions.unmount = handleUnmount
    actions.close = () => {
      store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction))
    }
  })

  createScrollLock(
    () =>
      open() &&
      modal() &&
      mounted() &&
      store.select('lastOpenChangeReason') !== REASONS.triggerHover &&
      parentFromContext().type === undefined
  )

  createFocusTrap({
    enabled: () =>
      open() &&
      mounted() &&
      modal() &&
      store.select('lastOpenChangeReason') !== REASONS.triggerHover,
    container: popupElement,
    initialFocus: () => {
      // Prefer highlighted item, else first item, else popup.
      const index = store.select('activeIndex')
      const items = store.context.itemDomElements.current
      if (index != null && items[index]) return items[index]
      const first = items.find(el => el != null)
      if (first) return first
      return popupElement()
    },
    restoreFocus: () => {
      const value = popupFinalFocus()
      if (value === false) return false
      if (value instanceof HTMLElement) return value
      return triggerElement()
    },
  })

  createDismiss({
    enabled: () => open() && mounted(),
    refs: () => [popupElement(), positionerElement(), viewportElement()],
    onDismiss: event => {
      const closeParent = local.closeParentOnEsc ?? false
      setOpen(false, createChangeEventDetails(REASONS.escapeKey, event))
      if (
        closeParent &&
        parentFromContext().type === 'menu' &&
        parentMenuRootContext
      ) {
        parentMenuRootContext.setOpen(
          false,
          createChangeEventDetails(REASONS.escapeKey, event)
        )
      }
    },
    escapeKey: true,
    outsidePress: false,
  })

  listenerEffect(
    () => {
      if (!open() || !mounted()) return null
      return document
    },
    'pointerdown',
    event => {
      if ('button' in event && event.button !== 0) {
        return
      }
      const target = getTarget(event) as Element | null
      if (!target) return

      const popup = popupElement()
      if (popup && contains(popup, target)) return
      const positioner = positionerElement()
      if (positioner && contains(positioner, target)) return

      if (
        isEventOnPopupTrigger(
          store.context.triggerElements,
          target,
          triggerElement()
        )
      ) {
        return
      }

      if (modal()) {
        const internalBackdrop = internalBackdropElement()
        const backdrop = backdropElement()
        const onBackdrop =
          (internalBackdrop != null &&
            (target === internalBackdrop ||
              contains(internalBackdrop, target))) ||
          (backdrop != null &&
            (target === backdrop || contains(backdrop, target)))
        if ((internalBackdrop != null || backdrop != null) && !onBackdrop) {
          return
        }
      }

      setOpen(false, createChangeEventDetails(REASONS.outsidePress, event))
    },
    true
  )

  // Lite list navigation + typeahead — handlers live on popup via context.
  let typeaheadBuffer = ''
  let typeaheadTimeout: ReturnType<typeof setTimeout> | undefined

  const moveActiveIndex = (next: number | null) => {
    if (store.select('activeIndex') === next) return
    store.set('activeIndex', next)
    if (next != null) {
      const el = store.context.itemDomElements.current[next]
      el?.focus({ preventScroll: true })
    }
  }

  const enabledIndices = () => {
    const items = store.context.itemDomElements.current
    return items
      .map((el, i) => (el && !el.hasAttribute('aria-disabled') ? i : -1))
      .filter(i => i >= 0)
  }

  const navigate = (direction: 1 | -1) => {
    const enabled = enabledIndices()
    if (enabled.length === 0) return
    const current = store.select('activeIndex')
    let pos = current == null ? -1 : enabled.indexOf(current)
    if (pos === -1) {
      pos = direction === 1 ? -1 : 0
    }
    let nextPos = pos + direction
    if (loopFocus()) {
      if (nextPos < 0) nextPos = enabled.length - 1
      if (nextPos >= enabled.length) nextPos = 0
    } else {
      nextPos = Math.max(0, Math.min(enabled.length - 1, nextPos))
    }
    moveActiveIndex(enabled[nextPos] ?? null)
  }

  const onPopupKeyDown = (event: KeyboardEvent) => {
    if (store.select('disabled')) return
    const key = event.key
    const vertical = orientation() === 'vertical'

    if (
      (vertical && key === 'ArrowDown') ||
      (!vertical && key === 'ArrowRight')
    ) {
      event.preventDefault()
      navigate(1)
      return
    }
    if (
      (vertical && key === 'ArrowUp') ||
      (!vertical && key === 'ArrowLeft')
    ) {
      event.preventDefault()
      navigate(-1)
      return
    }
    if (key === 'Home') {
      event.preventDefault()
      const enabled = enabledIndices()
      moveActiveIndex(enabled[0] ?? null)
      return
    }
    if (key === 'End') {
      event.preventDefault()
      const enabled = enabledIndices()
      moveActiveIndex(enabled[enabled.length - 1] ?? null)
      return
    }

    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      store.context.typingRef.current = true
      typeaheadBuffer += key.toLowerCase()
      if (typeaheadTimeout) clearTimeout(typeaheadTimeout)
      typeaheadTimeout = setTimeout(() => {
        typeaheadBuffer = ''
        store.context.typingRef.current = false
      }, TYPEAHEAD_RESET_MS)

      const labels = store.context.itemLabels.current
      const match = labels.findIndex(
        (label, i) =>
          label != null &&
          label.toLowerCase().startsWith(typeaheadBuffer) &&
          store.context.itemDomElements.current[i] != null
      )
      if (match >= 0) {
        moveActiveIndex(match)
      }
    }

    const relay = store.select('keyboardEventRelay')
    if (relay && !event.cancelBubble) {
      relay(event)
    }
  }

  onCleanup(() => {
    if (typeaheadTimeout) clearTimeout(typeaheadTimeout)
  })

  createEffect(() => {
    store.set('popupElement', popupElement())
    store.context.popupRef.current = popupElement()
  })
  createEffect(() => {
    store.set('positionerElement', positionerElement())
    store.context.positionerRef.current = positionerElement()
  })
  createEffect(() => {
    store.set('mounted', mounted())
  })
  createEffect(() => {
    // Sync floating root elements
    const floating = store.state.floatingRootContext
    if (!floating) return
    floating.update({
      open: open(),
      floatingId,
      referenceElement: store.select('activeTriggerElement'),
      floatingElement: positionerElement(),
      domReferenceElement: store.select('activeTriggerElement'),
    })
  })

  const registerItem = (element: HTMLElement, label: string | null) => {
    const elements = store.context.itemDomElements.current
    const labels = store.context.itemLabels.current
    let index = elements.indexOf(element)
    if (index === -1) {
      index = elements.findIndex(el => el == null)
      if (index === -1) {
        index = elements.length
        elements.push(element)
        labels.push(label)
      } else {
        elements[index] = element
        labels[index] = label
      }
    } else {
      labels[index] = label
    }
    return () => {
      const i = elements.indexOf(element)
      if (i !== -1) {
        elements[i] = null
        labels[i] = null
      }
    }
  }

  const contextValue = {
    store,
    parent: parentFromContext(),
    open,
    setOpen,
    modal,
    nested,
    mounted,
    mountedAssign,
    transitionStatus,
    popupElement,
    popupElementAssign,
    positionerElement,
    positionerElementAssign,
    viewportElement,
    viewportElementAssign,
    triggerElement,
    triggerElementAssign,
    backdropElement,
    backdropElementAssign,
    internalBackdropElement,
    internalBackdropElementAssign,
    arrowElement,
    arrowElementAssign,
    portalId: () => portalId,
    preventUnmountOnClose,
    preventUnmountOnCloseAssign,
    popupFinalFocus,
    popupFinalFocusAssign,
    openChangeReason: () => store.select('lastOpenChangeReason'),
    instantType: () => store.select('instantType'),
    orientation,
    loopFocus,
    highlightItemOnHover,
    registerItem,
    onPopupKeyDown,
    onOpenChangeComplete: local.onOpenChangeComplete,
  } satisfies MenuRootContextValue

  // Keep parent fresh when submenu mounts under a root.
  createEffect(() => {
    contextValue.parent = parentFromContext()
  })

  return (
    <MenuRootContext.Provider value={contextValue}>
      {local.children}
    </MenuRootContext.Provider>
  )
}

/** Props for {@link MenuRoot}. */
export type MenuRootProps = {
  children?: JSX.Element
  /**
   * Whether the menu is currently open.
   */
  open?: boolean
  /**
   * Whether the menu is initially open.
   * To render a controlled menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: MenuRootChangeEventDetails
  ) => void
  /**
   * Event handler called after any animations complete when the menu opens or closes.
   */
  onOpenChangeComplete?: (open: boolean) => void
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the menu should prevent outside clicks and lock scroll.
   * Ignored on nested menus.
   * @default true
   */
  modal?: boolean
  /**
   * Whether to loop keyboard focus when navigating items.
   * @default true
   */
  loopFocus?: boolean
  /**
   * Orientation of the menu items.
   * @default 'vertical'
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * A ref to imperative actions.
   */
  actionsRef?: MenuRootActions
  /**
   * When `true`, pressing Escape closes parent menus as well (submenu).
   * @default false
   */
  closeParentOnEsc?: boolean
  /**
   * A handle to associate detached triggers with this menu.
   */
  handle?: MenuHandle<unknown>
  /**
   * ID of the trigger that the menu is associated with.
   */
  triggerId?: string | null
  /**
   * ID of the trigger that the menu is associated with. Useful when controlling
   * the open state without a trigger component rendered.
   * @default null
   */
  defaultTriggerId?: string | null
  /**
   * Whether hovering items highlights them.
   * @default true
   */
  highlightItemOnHover?: boolean
}

/** Imperative actions for {@link MenuRoot}. */
export type MenuRootActions = {
  unmount: () => void
  close: () => void
}

/** Change event details for Menu open state. */
export type MenuRootChangeEventDetails =
  BaseUIChangeEventDetails<ChangeEventReason> & {
    preventUnmountOnClose?: () => void
  }

/** Change event reason for Menu. */
export type MenuRootChangeEventReason = ChangeEventReason

export type { MenuParent }
