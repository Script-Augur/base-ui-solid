import {
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
import { useDirection } from '../../internals/direction'
import { useButton } from '../../internals/useButton'
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext'
import { NavigationMenuPopupCssVars } from '../popup/NavigationMenuPopupCssVars'
import { NavigationMenuPositionerCssVars } from '../positioner/NavigationMenuPositionerCssVars'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'
import {
  NAVIGATION_MENU_TRIGGER_IDENTIFIER,
  PATIENT_CLICK_THRESHOLD,
} from '../utils/constants'
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent'
import { pressableTriggerOpenStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { NavigationMenuRootChangeEventReason } from '../root/NavigationMenuRoot'
import type { JSX } from 'solid-js'

/**
 * Opens the navigation menu popup when hovered or clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function NavigationMenuTrigger(
  componentProps: NavigationMenuTriggerProps
): JSX.Element {
  const context = useNavigationMenuRootContext()
  const item = useNavigationMenuItemContext()
  const direction = useDirection()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'disabled',
    'nativeButton',
  ])

  const disabled = () => local.disabled ?? false
  const itemValue = () => item.value()
  const isActiveItem = () => context.open() && context.value() === itemValue()

  const [stickIfOpen, stickIfOpenAssign] = createSignal(true)
  const [localTrigger, localTriggerAssign] = createSignal<HTMLElement | null>(
    null
  )

  let openTimeout: ReturnType<typeof setTimeout> | undefined
  let stickTimeout: ReturnType<typeof setTimeout> | undefined

  const clearOpenTimer = () => {
    if (openTimeout) {
      clearTimeout(openTimeout)
      openTimeout = undefined
    }
  }

  onCleanup(() => {
    clearOpenTimer()
    if (stickTimeout) clearTimeout(stickTimeout)
  })

  createEffect(() => {
    if (!context.open() && stickTimeout) {
      clearTimeout(stickTimeout)
      stickTimeout = undefined
      stickIfOpenAssign(true)
    }
  })

  createEffect(() => {
    if (isActiveItem()) {
      const el = localTrigger()
      if (el) {
        context.triggerElementAssign(el)
        context.prevTriggerElementAssign(el)
      }
    }
  })

  // mergeRenderProps snapshots getters on the stable button host; sync open
  // attrs imperatively (same approach as TabTrigger).
  createEffect(() => {
    const el = localTrigger()
    if (!el) return
    const open = isActiveItem()
    el.setAttribute('aria-expanded', open ? 'true' : 'false')
    if (open) {
      el.setAttribute('data-popup-open', '')
      el.setAttribute('data-pressed', '')
      const popupId = context.popupElement()?.id
      if (popupId) {
        el.setAttribute('aria-controls', popupId)
      }
    } else {
      el.removeAttribute('data-popup-open')
      el.removeAttribute('data-pressed')
      el.removeAttribute('aria-controls')
    }
  })

  // Lite popup size CSS vars when this item becomes active.
  createEffect(() => {
    if (!isActiveItem()) return
    const popup = context.popupElement()
    const positioner = context.positionerElement()
    if (!popup || !positioner) return

    const width = popup.offsetWidth
    const height = popup.offsetHeight
    if (width === 0 || height === 0) return

    popup.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${width}px`)
    popup.style.setProperty(
      NavigationMenuPopupCssVars.popupHeight,
      `${height}px`
    )
    positioner.style.setProperty(
      NavigationMenuPositionerCssVars.positionerWidth,
      `${width}px`
    )
    positioner.style.setProperty(
      NavigationMenuPositionerCssVars.positionerHeight,
      `${height}px`
    )

    const frame = requestAnimationFrame(() => {
      popup.style.setProperty(NavigationMenuPopupCssVars.popupWidth, 'auto')
      popup.style.setProperty(NavigationMenuPopupCssVars.popupHeight, 'auto')
    })
    onCleanup(() => cancelAnimationFrame(frame))
  })

  // Lite MutationObserver auto-size when content changes.
  createEffect(() => {
    if (!isActiveItem()) return
    const content = context.currentContentElement()
    const popup = context.popupElement()
    const positioner = context.positionerElement()
    if (!content || !popup || !positioner) return
    if (typeof MutationObserver !== 'function') return

    const observer = new MutationObserver(() => {
      const width = popup.offsetWidth
      const height = popup.offsetHeight
      if (width === 0 || height === 0) return
      positioner.style.setProperty(
        NavigationMenuPositionerCssVars.positionerWidth,
        `${width}px`
      )
      positioner.style.setProperty(
        NavigationMenuPositionerCssVars.positionerHeight,
        `${height}px`
      )
    })
    observer.observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['hidden'],
    })
    onCleanup(() => observer.disconnect())
  })

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  const setActivationDirectionFromTrigger = (triggerEl: HTMLElement) => {
    const prev = context.prevTriggerElement()
    if (!context.mounted() || !(prev instanceof HTMLElement)) return
    const prevRect = prev.getBoundingClientRect()
    const nextRect = triggerEl.getBoundingClientRect()
    const orientation = context.orientation()
    if (orientation === 'horizontal' && nextRect.left !== prevRect.left) {
      context.activationDirectionAssign(
        nextRect.left > prevRect.left ? 'right' : 'left'
      )
    } else if (orientation === 'vertical' && nextRect.top !== prevRect.top) {
      context.activationDirectionAssign(
        nextRect.top > prevRect.top ? 'down' : 'up'
      )
    }
  }

  const openItem = (
    event: Event,
    reason: NavigationMenuRootChangeEventReason
  ) => {
    if (disabled()) return
    const triggerEl = localTrigger()
    if (triggerEl) setActivationDirectionFromTrigger(triggerEl)

    if (reason === REASONS.triggerHover) {
      stickIfOpenAssign(true)
      if (stickTimeout) clearTimeout(stickTimeout)
      stickTimeout = setTimeout(() => {
        stickIfOpenAssign(false)
      }, PATIENT_CLICK_THRESHOLD)
    }

    context.setValue(itemValue(), createChangeEventDetails(reason, event))
  }

  const closeItem = (
    event: Event,
    reason: NavigationMenuRootChangeEventReason
  ) => {
    if (disabled()) return
    if (context.value() !== itemValue()) return
    context.setValue(null, createChangeEventDetails(reason, event))
  }

  const state: NavigationMenuTriggerState = {
    get open() {
      return isActiveItem()
    },
  }

  return (
    <CompositeItem
      tag="button"
      render={local.render}
      class={local.class}
      style={local.style}
      state={state}
      stateAttributesMapping={pressableTriggerOpenStateMapping}
      props={[
        getButtonProps(
          mergeProps(elementProps as Record<string, unknown>, {
            [NAVIGATION_MENU_TRIGGER_IDENTIFIER]: '',
            onClick(event: MouseEvent) {
              if (disabled()) return
              if (
                isActiveItem() &&
                stickIfOpen() &&
                context.openChangeReason() === REASONS.triggerHover
              ) {
                return
              }
              if (isActiveItem()) {
                closeItem(event, REASONS.triggerPress)
              } else {
                openItem(event, REASONS.triggerPress)
              }
            },
            onPointerEnter(event: PointerEvent) {
              if (disabled()) return
              if (event.pointerType === 'touch') return
              clearOpenTimer()
              context.clearHoverTimers()
              openTimeout = setTimeout(() => {
                openItem(event, REASONS.triggerHover)
              }, context.delay())
            },
            onPointerLeave(event: PointerEvent) {
              if (disabled()) return
              if (event.pointerType === 'touch') return
              clearOpenTimer()
              // Root owns the close timer so Popup/Positioner/Viewport can
              // cancel it when the pointer reaches the floating surface.
              context.scheduleHoverClose(event)
            },
            onKeyDown(event: KeyboardEvent) {
              if (disabled()) return
              // Nested triggers participate in parent Content composite nav.
              if (context.nested()) return

              const verticalOpenKey =
                direction() === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
              const openHorizontal =
                context.orientation() === 'horizontal' &&
                event.key === 'ArrowDown'
              const openVertical =
                context.orientation() === 'vertical' &&
                event.key === verticalOpenKey

              if (openHorizontal || openVertical) {
                event.preventDefault()
                openItem(event, REASONS.listNavigation)
              }
            },
            onBlur(event: FocusEvent) {
              if (disabled()) return
              if (!isActiveItem()) return
              const positioner = context.positionerElement()
              const popup = context.popupElement()
              if (!positioner || !popup) return
              if (
                isOutsideMenuEvent(
                  {
                    currentTarget: event.currentTarget as HTMLElement,
                    relatedTarget:
                      (event.relatedTarget as HTMLElement | null) ?? null,
                  },
                  {
                    popupElement: popup,
                    rootElement: context.rootElement(),
                  }
                )
              ) {
                closeItem(event, REASONS.focusOut)
              }
            },
          })
        ),
        {
          get 'aria-expanded'() {
            return isActiveItem()
          },
          get 'aria-haspopup'() {
            return 'dialog' as const
          },
          get 'aria-controls'() {
            return isActiveItem()
              ? (context.popupElement()?.id ?? undefined)
              : undefined
          },
        },
      ]}
      refs={[
        el => {
          buttonRefAssign(el)
          localTriggerAssign(el)
          const userRef = local.ref
          if (typeof userRef === 'function') {
            userRef(el as HTMLButtonElement)
          }
        },
      ]}
    >
      {local.children}
    </CompositeItem>
  )
}

/** Public state for {@link NavigationMenuTrigger}. */
export interface NavigationMenuTriggerState extends Record<string, unknown> {
  open: boolean
}

/** Props for {@link NavigationMenuTrigger}. */
export type NavigationMenuTriggerProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  render?: RenderProp<NavigationMenuTriggerState, Record<string, unknown>>
}
