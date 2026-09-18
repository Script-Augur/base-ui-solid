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
import { createControlled } from '../../internals/createControlled'
import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createRender } from '../../internals/createRender'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants'

import {
  NavigationMenuRootContext,
  useNavigationMenuRootContext,
} from './NavigationMenuRootContext'

import type {
  NavigationMenuActivationDirection,
  NavigationMenuRootContextValue,
} from './NavigationMenuRootContext'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of the navigation menu.
 * Renders a `<nav>` element at the root, or `<div>` element when nested.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Root props (`value`, `defaultValue`, `orientation`, …).
 * @returns A Solid JSX element wrapping children in context.
 */
export function NavigationMenuRoot(
  componentProps: NavigationMenuRootProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'children',
    'render',
    'class',
    'style',
    'ref',
    'defaultValue',
    'value',
    'onValueChange',
    'actionsRef',
    'delay',
    'closeDelay',
    'orientation',
    'onOpenChangeComplete',
  ])

  const parentContext = useNavigationMenuRootContext(true)
  const nested = () => parentContext != null

  const [value, valueAssign] = createControlled({
    value: () => local.value,
    defaultValue: local.defaultValue ?? null,
  })

  const open = () => value() != null

  const delay = () => local.delay ?? OPEN_DELAY
  const closeDelay = () => local.closeDelay ?? CLOSE_DELAY
  const orientation = () => local.orientation ?? 'horizontal'

  const { mounted, mountedAssign, transitionStatus } =
    createTransitionStatus(open)

  const [positionerElement, positionerElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [popupElement, popupElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [viewportElement, viewportElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [triggerElement, triggerElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [rootElement, rootElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [currentContentElement, currentContentElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [activationDirection, activationDirectionAssign] =
    createSignal<NavigationMenuActivationDirection>(null)
  const [prevTriggerElement, prevTriggerElementAssign] = createSignal<
    Element | null | undefined
  >(null)
  const [closeReason, closeReasonAssign] =
    createSignal<ChangeEventReason | null>(null)
  const [openChangeReason, openChangeReasonAssign] =
    createSignal<ChangeEventReason | null>(null)

  let hoverCloseTimeout: ReturnType<typeof setTimeout> | undefined

  const clearHoverTimers = () => {
    if (hoverCloseTimeout) {
      clearTimeout(hoverCloseTimeout)
      hoverCloseTimeout = undefined
    }
  }

  onCleanup(clearHoverTimers)

  const setValue = (
    nextValue: unknown,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => {
    if (nextValue == null) {
      closeReasonAssign(eventDetails.reason)
    }

    if (nextValue !== value()) {
      local.onValueChange?.(
        nextValue,
        eventDetails as NavigationMenuRootChangeEventDetails
      )
    }

    if (eventDetails.isCanceled) return

    if (nextValue == null) {
      activationDirectionAssign(null)
      openChangeReasonAssign(null)
      clearHoverTimers()
    } else {
      openChangeReasonAssign(eventDetails.reason)
    }

    valueAssign(nextValue)

    // Nested link-press closes parent menus (Lite nest via parent context).
    if (
      nested() &&
      nextValue == null &&
      eventDetails.reason === REASONS.linkPress &&
      parentContext
    ) {
      parentContext.setValue(null, eventDetails)
    }
  }

  const scheduleHoverClose = (event?: Event) => {
    clearHoverTimers()
    if (openChangeReason() !== REASONS.triggerHover) return
    hoverCloseTimeout = setTimeout(() => {
      if (open() && openChangeReason() === REASONS.triggerHover) {
        setValue(null, createChangeEventDetails(REASONS.triggerHover, event))
      }
    }, closeDelay())
  }

  const onPopupPointerEnter = () => {
    clearHoverTimers()
  }

  const onPopupPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    scheduleHoverClose(event)
  }

  const handleUnmount = () => {
    const prev = prevTriggerElement()
    const popup = popupElement()
    const reason = closeReason()
    const blocked =
      reason === REASONS.triggerHover ||
      reason === REASONS.outsidePress ||
      reason === REASONS.focusOut

    if (
      !blocked &&
      prev instanceof HTMLElement &&
      popup &&
      (document.activeElement === document.body ||
        popup.contains(document.activeElement))
    ) {
      prev.focus({ preventScroll: true })
      prevTriggerElementAssign(undefined)
    }

    mountedAssign(false)
    local.onOpenChangeComplete?.(false)
    activationDirectionAssign(null)
    currentContentElementAssign(null)
    closeReasonAssign(null)
  }

  createEffect(() => {
    const actions = local.actionsRef
    if (!actions) return
    actions.unmount = handleUnmount
  })

  createOpenChangeComplete({
    open,
    element: popupElement,
    enabled: () => !local.actionsRef,
    onComplete() {
      if (!open()) {
        handleUnmount()
      } else {
        local.onOpenChangeComplete?.(true)
      }
    },
  })

  const contextValue: NavigationMenuRootContextValue = {
    open,
    value,
    setValue,
    mounted,
    mountedAssign,
    transitionStatus,
    positionerElement,
    positionerElementAssign,
    popupElement,
    popupElementAssign,
    viewportElement,
    viewportElementAssign,
    triggerElement,
    triggerElementAssign,
    rootElement,
    rootElementAssign,
    currentContentElement,
    currentContentElementAssign,
    activationDirection,
    activationDirectionAssign,
    prevTriggerElement,
    prevTriggerElementAssign,
    nested,
    delay,
    closeDelay,
    orientation,
    onOpenChangeComplete: local.onOpenChangeComplete,
    closeReason,
    closeReasonAssign,
    openChangeReason,
    openChangeReasonAssign,
    clearHoverTimers,
    scheduleHoverClose,
    onPopupPointerEnter,
    onPopupPointerLeave,
  }

  const state: NavigationMenuRootState = {
    get open() {
      return open()
    },
    get nested() {
      return nested()
    },
  }

  return (
    <NavigationMenuRootContext.Provider value={contextValue}>
      {createRender<NavigationMenuRootState, Record<string, unknown>>({
        defaultElement: nested() ? 'div' : 'nav',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get 'aria-orientation'() {
            return orientation()
          },
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          children: local.children,
          ref(element: HTMLElement) {
            rootElementAssign(element)
            const userRef = local.ref
            if (typeof userRef === 'function') {
              userRef(element)
            }
          },
        }),
      })}
    </NavigationMenuRootContext.Provider>
  )
}

/** Public state for {@link NavigationMenuRoot}. */
export interface NavigationMenuRootState extends Record<string, unknown> {
  open: boolean
  nested: boolean
}

/** Props for {@link NavigationMenuRoot}. */
export type NavigationMenuRootProps = Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'onChange'
> & {
  children?: JSX.Element
  /**
   * The controlled value of the item that should be currently open.
   * When non-nullish, the menu is open. When nullish, the menu is closed.
   * @default null
   */
  value?: unknown
  /**
   * The uncontrolled value of the item that should be initially open.
   * @default null
   */
  defaultValue?: unknown
  /** Called when the open item value changes. */
  onValueChange?: (
    value: unknown,
    eventDetails: NavigationMenuRootChangeEventDetails
  ) => void
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void
  /**
   * Imperative actions (`unmount`). When set, close completion does not auto-unmount.
   */
  actionsRef?: NavigationMenuRootActions
  /**
   * How long to wait before opening on hover, in ms.
   * @default 50
   */
  delay?: number
  /**
   * How long to wait before closing on hover out, in ms.
   * @default 50
   */
  closeDelay?: number
  /**
   * Orientation of the navigation list.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
  render?: RenderProp<NavigationMenuRootState, Record<string, unknown>>
}

/** Imperative actions exposed via `actionsRef`. */
export type NavigationMenuRootActions = {
  unmount: () => void
}

/** Change-event reason for Navigation Menu. */
export type NavigationMenuRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.triggerHover
  | typeof REASONS.outsidePress
  | typeof REASONS.listNavigation
  | typeof REASONS.focusOut
  | typeof REASONS.escapeKey
  | typeof REASONS.linkPress
  | typeof REASONS.none

/** Change-event details for Navigation Menu. */
export type NavigationMenuRootChangeEventDetails =
  BaseUIChangeEventDetails<NavigationMenuRootChangeEventReason>
