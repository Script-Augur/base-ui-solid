import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { usePopoverPortalContext } from '../portal/PopoverPortalContext'
import { usePopoverRootContext } from '../root/PopoverRootContext'
import { popupTransitionStateMapping } from '../utils/stateAttributesMapping'

import { PopoverViewportDataAttributes } from './PopoverViewportDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * A viewport for transitioning between popover contents.
 * Renders a `<div>` element.
 *
 * Lite: mounts children without multi-trigger content transitions (deferred —
 * see UPSTREAM_TEST_PARITY.md).
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 *
 * @param componentProps - Viewport props.
 * @returns A Solid JSX element when mounted / keepMounted.
 */
export function PopoverViewport(
  componentProps: PopoverViewportProps
): JSX.Element {
  const keepMounted = usePopoverPortalContext()
  const context = usePopoverRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: PopoverViewportState = {
    get open() {
      return context.open()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
  }

  const shouldRender = () => keepMounted || context.mounted()

  return (
    <Show when={shouldRender()}>
      {createRender<PopoverViewportState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: popupTransitionStateMapping,
        props: mergeProps(elementProps as Record<string, unknown>, {
          role: 'presentation',
          get ['attr:hidden']() {
            return context.mounted() ? undefined : true
          },
          get class() {
            return local.class
          },
          get style() {
            const base: JSX.CSSProperties = {
              'pointer-events': !context.open() ? 'none' : undefined,
            }
            const user = local.style
            if (user && typeof user === 'object' && !Array.isArray(user)) {
              return { ...base, ...user }
            }
            return base
          },
          get [PopoverViewportDataAttributes.current]() {
            return ''
          },
          children: local.children,
          ref(element: HTMLElement) {
            context.viewportElementAssign(element)
            const userRef = local.ref
            if (typeof userRef === 'function') {
              userRef(element as HTMLDivElement)
            }
          },
        }),
      })}
    </Show>
  )
}

/** Public state for {@link PopoverViewport}. */
export interface PopoverViewportState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link PopoverViewport}. */
export type PopoverViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<PopoverViewportState, Record<string, unknown>>
}
