import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { usePopoverRootContext } from '../root/PopoverRootContext'
import { OPEN_DELAY } from '../utils/constants'
import { triggerOpenStateMapping } from '../utils/stateAttributesMapping'

import { PopoverTriggerDataAttributes } from './PopoverTriggerDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A button that opens the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function PopoverTrigger(
  componentProps: PopoverTriggerProps
): JSX.Element {
  const context = usePopoverRootContext()

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
  ])

  const disabled = () => local.disabled ?? false

  createEffect(() => {
    context.openOnHoverAssign(local.openOnHover ?? false)
    context.hoverDelayAssign(local.delay ?? OPEN_DELAY)
    context.hoverCloseDelayAssign(local.closeDelay ?? 0)
  })

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  let openTimeout: ReturnType<typeof setTimeout> | undefined
  let closeTimeout: ReturnType<typeof setTimeout> | undefined

  const clearHoverTimers = () => {
    if (openTimeout) {
      clearTimeout(openTimeout)
      openTimeout = undefined
    }
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      closeTimeout = undefined
    }
  }

  onCleanup(clearHoverTimers)

  const state: PopoverTriggerState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return context.open()
    },
  }

  return createRender<PopoverTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: triggerOpenStateMapping,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          onClick(event: MouseEvent) {
            if (disabled()) return
            // Match Floating UI useClick: stickIfOpen only blocks close when
            // the popup was opened by a non-click event (hover). Click-open
            // must still toggle closed on a second trigger press.
            if (
              context.open() &&
              context.stickIfOpen() &&
              context.openChangeReason() === REASONS.triggerHover
            ) {
              return
            }
            const next = !context.open()
            context.setOpen(
              next,
              createChangeEventDetails(REASONS.triggerPress, event)
            )
          },
          onPointerEnter(event: PointerEvent) {
            if (disabled() || !(local.openOnHover ?? false)) return
            if (event.pointerType === 'touch') return
            clearHoverTimers()
            openTimeout = setTimeout(() => {
              if (!context.open()) {
                context.setOpen(
                  true,
                  createChangeEventDetails(REASONS.triggerHover, event)
                )
              }
            }, local.delay ?? OPEN_DELAY)
          },
          onPointerLeave(event: PointerEvent) {
            if (disabled() || !(local.openOnHover ?? false)) return
            if (event.pointerType === 'touch') return
            clearHoverTimers()
            closeTimeout = setTimeout(() => {
              if (
                context.open() &&
                context.openChangeReason() === REASONS.triggerHover
              ) {
                context.setOpen(
                  false,
                  createChangeEventDetails(REASONS.triggerHover, event)
                )
              }
            }, local.closeDelay ?? 0)
          },
        }) as Record<string, unknown>
      ),
      {
        get 'aria-haspopup'() {
          return 'dialog' as const
        },
        get 'aria-expanded'() {
          return context.open()
        },
        get 'aria-controls'() {
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
        get [PopoverTriggerDataAttributes.popupOpen]() {
          return context.open() ? '' : undefined
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

/** Public state for {@link PopoverTrigger}. */
export interface PopoverTriggerState extends Record<string, unknown> {
  disabled: boolean
  open: boolean
}

/** Props for {@link PopoverTrigger}. */
export type PopoverTriggerProps = Omit<
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
   * Whether the popover opens on hover.
   * @default false
   */
  openOnHover?: boolean
  /**
   * How long to wait before opening after hover, in ms.
   * @default 300
   */
  delay?: number
  /**
   * How long to wait before closing after hover out, in ms.
   * @default 0
   */
  closeDelay?: number
  /**
   * Detached-trigger handle. Deferred — see UPSTREAM_TEST_PARITY.md.
   */
  handle?: unknown
  /**
   * Payload for detached triggers. Deferred.
   */
  payload?: unknown
  render?: RenderProp<PopoverTriggerState, Record<string, unknown>>
}
