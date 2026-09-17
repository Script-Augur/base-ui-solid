import { contains } from '@script-augur/base-ui-utils'
import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useTooltipProviderContext } from '../provider/TooltipProviderContext'
import { useTooltipRootContext } from '../root/TooltipRootContext'
import { OPEN_DELAY } from '../utils/constants'
import { ensureFocusModalityListeners, isFocusVisibleOpenAllowed } from '../utils/isFocusVisibleOpenAllowed'
import { triggerOpenStateMapping } from '../utils/stateAttributesMapping'

import { TooltipTriggerDataAttributes } from './TooltipTriggerDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A button that shows the tooltip when hovered or focused.
 * Renders a `<button>` element.
 *
 * Unlike `Popover.Trigger` / `Dialog.Trigger`, clicking alone never opens the
 * tooltip — only hover (mouse only) and keyboard / `:focus-visible` focus do.
 * By default, pressing the trigger cancels a pending open or closes an open
 * tooltip (`closeOnClick`).
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function TooltipTrigger(
  componentProps: TooltipTriggerProps
): JSX.Element {
  const context = useTooltipRootContext()
  const providerContext = useTooltipProviderContext(true)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'delay',
    'closeDelay',
    'closeOnClick',
    'ref',
  ])

  const disabled = () => (local.disabled ?? false) || context.disabled()

  // Bind modality listeners before any pointerdown → focus sequence.
  ensureFocusModalityListeners()

  createEffect(() => {
    context.openDelayAssign(
      local.delay ?? providerContext?.delay() ?? OPEN_DELAY
    )
    context.closeDelayAssign(
      local.closeDelay ?? providerContext?.closeDelay() ?? 0
    )
    context.closeOnClickAssign(local.closeOnClick ?? true)
  })

  // `useButton`'s own `disabled` gate would set the native `disabled`
  // attribute; upstream tooltip triggers never do that (they must stay
  // focusable/hoverable for nested-disabled-button scenarios), so we pass
  // `false` here and guard interactions with our own `disabled()` instead.
  const { getButtonProps, buttonRefAssign } = useButton({
    disabled: () => false,
    native: () => local.nativeButton ?? true,
  })

  let openTimeout: ReturnType<typeof setTimeout> | undefined
  let blurCloseTimeout: ReturnType<typeof setTimeout> | undefined

  const clearOpenTimer = () => {
    if (openTimeout) {
      clearTimeout(openTimeout)
      openTimeout = undefined
    }
  }

  const clearBlurCloseTimer = () => {
    if (blurCloseTimeout) {
      clearTimeout(blurCloseTimeout)
      blurCloseTimeout = undefined
    }
  }

  onCleanup(() => {
    clearOpenTimer()
    clearBlurCloseTimer()
    context.cancelScheduledClose()
  })

  const handleCloseOnClick = (event: MouseEvent | PointerEvent) => {
    if (disabled()) return
    if (!(local.closeOnClick ?? true)) return
    clearOpenTimer()
    if (context.open()) {
      context.setOpen(
        false,
        createChangeEventDetails(REASONS.triggerPress, event)
      )
    }
  }

  const state: TooltipTriggerState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return context.open()
    },
  }

  return createRender<TooltipTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: triggerOpenStateMapping,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          onPointerDown: handleCloseOnClick,
          onClick: handleCloseOnClick,
          onPointerEnter(event: PointerEvent) {
            if (disabled()) return
            if (event.pointerType === 'touch') return
            context.cancelScheduledClose()
            clearOpenTimer()
            const instant = providerContext?.instantPhase() ?? false
            const delay = instant
              ? 0
              : (local.delay ?? providerContext?.delay() ?? OPEN_DELAY)
            openTimeout = setTimeout(() => {
              openTimeout = undefined
              if (!context.open()) {
                context.setOpen(
                  true,
                  createChangeEventDetails(REASONS.triggerHover, event)
                )
              }
            }, delay)
          },
          onPointerLeave(event: PointerEvent) {
            if (disabled()) return
            if (event.pointerType === 'touch') return
            clearOpenTimer()
            context.scheduleClose(event)
          },
          onFocus(event: FocusEvent) {
            if (disabled()) return
            const target = event.currentTarget
            if (!(target instanceof Element)) return
            if (!isFocusVisibleOpenAllowed(target)) return
            clearOpenTimer()
            clearBlurCloseTimer()
            context.cancelScheduledClose()
            if (!context.open()) {
              context.setOpen(
                true,
                createChangeEventDetails(REASONS.triggerFocus, event)
              )
            }
          },
          onBlur(event: FocusEvent) {
            if (disabled()) return
            if (
              !context.open() ||
              context.openChangeReason() !== REASONS.triggerFocus
            ) {
              return
            }

            // Defer so focus can land in the popup / a focusable child first.
            clearBlurCloseTimer()
            const nativeEvent = event
            blurCloseTimeout = setTimeout(() => {
              blurCloseTimeout = undefined
              if (
                !context.open() ||
                context.openChangeReason() !== REASONS.triggerFocus
              ) {
                return
              }

              const related = nativeEvent.relatedTarget as Node | null
              const active = document.activeElement
              const popup = context.popupElement()
              const positioner = context.positionerElement()
              const viewport = context.viewportElement()
              const trigger = context.triggerElement()

              if (contains(popup, related) || contains(popup, active)) return
              if (
                contains(positioner, related) ||
                contains(positioner, active)
              ) {
                return
              }
              if (contains(viewport, related) || contains(viewport, active)) {
                return
              }
              if (contains(trigger, related) || contains(trigger, active)) {
                return
              }

              context.setOpen(
                false,
                createChangeEventDetails(REASONS.triggerFocus, nativeEvent)
              )
            }, 0)
          },
        }) as Record<string, unknown>
      ),
      {
        get 'aria-describedby'() {
          return context.open()
            ? (context.popupElement()?.id ?? undefined)
            : undefined
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get [TooltipTriggerDataAttributes.popupOpen]() {
          return context.open() ? '' : undefined
        },
        get ['data-base-ui-tooltip-trigger']() {
          return disabled() ? undefined : ''
        },
        ref(element: HTMLElement) {
          buttonRefAssign(element)
          context.triggerElementAssign(element)
          const userRef = local.ref
          if (typeof userRef === 'function') {
            userRef(element as HTMLButtonElement)
          }
        },
      }
    ),
  })
}

/** Public state for {@link TooltipTrigger}. */
export interface TooltipTriggerState extends Record<string, unknown> {
  disabled: boolean
  open: boolean
}

/** Props for {@link TooltipTrigger}. */
export type TooltipTriggerProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  /**
   * How long to wait before opening after hover, in ms.
   * Focus-open ignores this delay (opens immediately when focus-visible).
   * @default 600
   */
  delay?: number
  /**
   * How long to wait before closing after hover out, in ms.
   * @default 0
   */
  closeDelay?: number
  /**
   * Whether pressing the trigger cancels a pending open (if closed) or
   * closes the tooltip (if open).
   * @default true
   */
  closeOnClick?: boolean
  /**
   * Detached-trigger handle. Deferred — see UPSTREAM_TEST_PARITY.md.
   */
  handle?: unknown
  /**
   * Payload for detached triggers. Deferred.
   */
  payload?: unknown
  render?: RenderProp<TooltipTriggerState, Record<string, unknown>>
}
