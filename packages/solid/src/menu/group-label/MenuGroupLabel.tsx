import { generateId } from '@script-augur/base-ui-utils'
import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useMenuGroupContext } from '../group/MenuGroupContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An accessible label for a group of menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuGroupLabel(
  componentProps: MenuGroupLabelProps
): JSX.Element {
  const labelIdAssign = useMenuGroupContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'id',
  ])

  const id = local.id ?? generateId('base-ui-menu-group-label')

  createEffect(() => {
    labelIdAssign?.(id)
    onCleanup(() => labelIdAssign?.(undefined))
  })

  return createRender<MenuGroupLabelState, Record<string, unknown>>({
    defaultElement: 'div',
    state: {},
    render: local.render,
    mapStateToDataAttributes: false,
    props: mergeProps(elementProps as Record<string, unknown>, {
      id,
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      children: local.children,
      ref: local.ref,
    }),
  })
}

/** Public state for {@link MenuGroupLabel}. */
export interface MenuGroupLabelState extends Record<string, unknown> {}

/** Props for {@link MenuGroupLabel}. */
export type MenuGroupLabelProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<MenuGroupLabelState, Record<string, unknown>>
}
