import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { usePreviewCardPortalContext } from '../portal/PreviewCardPortalContext'
import { usePreviewCardRootContext } from '../root/PreviewCardRootContext'
import { popupTransitionStateMapping } from '../utils/stateAttributesMapping'

import { PreviewCardViewportDataAttributes } from './PreviewCardViewportDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * A viewport for transitioning between preview card contents.
 * Renders a `<div>` element.
 *
 * Lite: mounts children without multi-trigger content transitions (deferred —
 * see UPSTREAM_TEST_PARITY.md).
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 *
 * @param componentProps - Viewport props.
 * @returns A Solid JSX element when mounted / keepMounted.
 */
export function PreviewCardViewport(
  componentProps: PreviewCardViewportProps
): JSX.Element {
  const keepMounted = usePreviewCardPortalContext()
  const context = usePreviewCardRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: PreviewCardViewportState = {
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
      {createRender<PreviewCardViewportState, Record<string, unknown>>({
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
          get [PreviewCardViewportDataAttributes.current]() {
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

/** Public state for {@link PreviewCardViewport}. */
export interface PreviewCardViewportState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link PreviewCardViewport}. */
export type PreviewCardViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<PreviewCardViewportState, Record<string, unknown>>
}
