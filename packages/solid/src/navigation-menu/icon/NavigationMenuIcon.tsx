import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'
import { triggerOpenStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An icon that indicates that the trigger button opens a menu.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Icon props.
 * @returns A Solid JSX element.
 */
export function NavigationMenuIcon(
  componentProps: NavigationMenuIconProps
): JSX.Element {
  const root = useNavigationMenuRootContext()
  const item = useNavigationMenuItemContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const isActiveItem = () => root.open() && root.value() === item.value()

  const state: NavigationMenuIconState = {
    get open() {
      return isActiveItem()
    },
  }

  return createRender<NavigationMenuIconState, Record<string, unknown>>({
    defaultElement: 'span',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: triggerOpenStateMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      'aria-hidden': true,
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get children() {
        return local.children ?? '▼'
      },
      ref: local.ref,
    }),
  })
}

/** Public state for {@link NavigationMenuIcon}. */
export interface NavigationMenuIconState extends Record<string, unknown> {
  open: boolean
}

/** Props for {@link NavigationMenuIcon}. */
export type NavigationMenuIconProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  render?: RenderProp<NavigationMenuIconState, Record<string, unknown>>
}
