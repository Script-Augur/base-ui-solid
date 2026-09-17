import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * The clipping viewport of the navigation menu's current content.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Viewport props.
 * @returns A Solid JSX element.
 */
export function NavigationMenuViewport(
  componentProps: NavigationMenuViewportProps
): JSX.Element {
  const context = useNavigationMenuRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: NavigationMenuViewportState = {}

  return createRender<NavigationMenuViewportState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: false,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      children: local.children,
      onPointerEnter() {
        context.onPopupPointerEnter()
      },
      onPointerLeave(event: PointerEvent) {
        context.onPopupPointerLeave(event)
      },
      ref(element: HTMLElement) {
        context.viewportElementAssign(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}

/** Public state for {@link NavigationMenuViewport}. */
export interface NavigationMenuViewportState extends Record<string, unknown> {}

/** Props for {@link NavigationMenuViewport}. */
export type NavigationMenuViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<NavigationMenuViewportState, Record<string, unknown>>
}
