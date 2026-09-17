import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { usePreviewCardRootContext } from '../root/PreviewCardRootContext'
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants'
import { triggerOpenStateMapping } from '../utils/stateAttributesMapping'

import { PreviewCardTriggerDataAttributes } from './PreviewCardTriggerDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A link that opens the preview card.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function PreviewCardTrigger(
  componentProps: PreviewCardTriggerProps
): JSX.Element {
  const context = usePreviewCardRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'delay',
    'closeDelay',
    'ref',
  ])

  createEffect(() => {
    context.hoverDelayAssign(local.delay ?? OPEN_DELAY)
    context.hoverCloseDelayAssign(local.closeDelay ?? CLOSE_DELAY)
  })

  onCleanup(() => {
    context.clearHoverTimers()
  })

  const state: PreviewCardTriggerState = {
    get open() {
      return context.open()
    },
  }

  return createRender<PreviewCardTriggerState, Record<string, unknown>>({
    defaultElement: 'a',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: triggerOpenStateMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      onPointerEnter(event: PointerEvent) {
        if (event.pointerType === 'touch') return
        context.clearHoverTimers()
        context.scheduleOpen(REASONS.triggerHover, event)
      },
      onPointerLeave(event: PointerEvent) {
        if (event.pointerType === 'touch') return
        context.scheduleClose(REASONS.triggerHover, event)
      },
      onFocus(event: FocusEvent) {
        context.clearHoverTimers()
        context.scheduleOpen(REASONS.triggerFocus, event)
      },
      onBlur(event: FocusEvent) {
        // Instant close on blur when opened via focus (matches upstream instantType).
        if (
          context.open() &&
          context.openChangeReason() === REASONS.triggerFocus
        ) {
          context.setOpen(
            false,
            createChangeEventDetails(REASONS.triggerFocus, event)
          )
        }
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get [PreviewCardTriggerDataAttributes.popupOpen]() {
        return context.open() ? '' : undefined
      },
      ref(element: HTMLElement) {
        context.triggerElementAssign(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLAnchorElement)
        }
      },
    }),
  })
}

/** Public state for {@link PreviewCardTrigger}. */
export interface PreviewCardTriggerState extends Record<string, unknown> {
  open: boolean
}

/** Props for {@link PreviewCardTrigger}. */
export type PreviewCardTriggerProps =
  JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {
    /**
     * How long to wait before opening after hover/focus, in ms.
     * @default 600
     */
    delay?: number
    /**
     * How long to wait before closing after hover out, in ms.
     * @default 300
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
    render?: RenderProp<PreviewCardTriggerState, Record<string, unknown>>
  }
