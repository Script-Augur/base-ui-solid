import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useTooltipPortalContext } from '../portal/TooltipPortalContext'
import { useTooltipRootContext } from '../root/TooltipRootContext'
import { popupTransitionStateMapping } from '../utils/stateAttributesMapping'

import { TooltipViewportDataAttributes } from './TooltipViewportDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * A viewport for transitioning between tooltip contents.
 * Renders a `<div>` element.
 *
 * Lite: mounts children without multi-trigger content transitions (deferred —
 * see UPSTREAM_TEST_PARITY.md).
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 *
 * @param componentProps - Viewport props.
 * @returns A Solid JSX element when mounted / keepMounted.
 */
export function TooltipViewport(
  componentProps: TooltipViewportProps
): JSX.Element {
  const keepMounted = useTooltipPortalContext()
  const context = useTooltipRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: TooltipViewportState = {
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
      {createRender<TooltipViewportState, Record<string, unknown>>({
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
          get [TooltipViewportDataAttributes.current]() {
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

/** Public state for {@link TooltipViewport}. */
export interface TooltipViewportState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link TooltipViewport}. */
export type TooltipViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<TooltipViewportState, Record<string, unknown>>
}
