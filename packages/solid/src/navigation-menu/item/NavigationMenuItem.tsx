import { createUniqueId, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import { NavigationMenuItemContext } from './NavigationMenuItemContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An individual navigation menu item.
 * Renders an `<li>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Item props (`value`, …).
 * @returns A Solid JSX element.
 */
export function NavigationMenuItem(
  componentProps: NavigationMenuItemProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'value',
  ])

  const fallbackValue = createUniqueId()
  const itemValue = () => local.value ?? fallbackValue

  const state: NavigationMenuItemState = {}

  return (
    <NavigationMenuItemContext.Provider value={{ value: itemValue }}>
      {createRender<NavigationMenuItemState, Record<string, unknown>>({
        defaultElement: 'li',
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
          ref: local.ref,
        }),
      })}
    </NavigationMenuItemContext.Provider>
  )
}

/** Public state for {@link NavigationMenuItem}. */
export interface NavigationMenuItemState extends Record<string, unknown> {}

/** Props for {@link NavigationMenuItem}. */
export type NavigationMenuItemProps = JSX.HTMLAttributes<HTMLLIElement> & {
  /**
   * A unique value that identifies this navigation menu item.
   * If omitted, a unique id is generated.
   */
  value?: unknown
  render?: RenderProp<NavigationMenuItemState, Record<string, unknown>>
}
