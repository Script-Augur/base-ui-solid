import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useMenuPortalContext } from '../portal/MenuPortalContext'
import { useMenuRootContext } from '../root/MenuRootContext'
import { popupTransitionStateMapping } from '../utils/stateAttributesMapping'

import { MenuViewportDataAttributes } from './MenuViewportDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * A viewport for transitioning between menu contents.
 * Renders a `<div>` element.
 *
 * Lite: mounts children without multi-trigger content transitions (deferred —
 * see UPSTREAM_TEST_PARITY.md).
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuViewport(componentProps: MenuViewportProps): JSX.Element {
  const keepMounted = useMenuPortalContext()
  const context = useMenuRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: MenuViewportState = {
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
      {createRender<MenuViewportState, Record<string, unknown>>({
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
          get [MenuViewportDataAttributes.current]() {
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

/** Public state for {@link MenuViewport}. */
export interface MenuViewportState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link MenuViewport}. */
export type MenuViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<MenuViewportState, Record<string, unknown>>
}
