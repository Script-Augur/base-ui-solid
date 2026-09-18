import { createSignal, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import { MenuGroupContext } from './MenuGroupContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Groups related menu items with the corresponding label.
 * Renders a `<div>` element with `role="group"`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuGroup(componentProps: MenuGroupProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const [labelId, labelIdAssign] = createSignal<string | undefined>()

  return (
    <MenuGroupContext.Provider value={labelIdAssign}>
      {createRender<MenuGroupState, Record<string, unknown>>({
        defaultElement: 'div',
        state: {},
        render: local.render,
        mapStateToDataAttributes: false,
        props: mergeProps(elementProps as Record<string, unknown>, {
          role: 'group',
          get 'aria-labelledby'() {
            return labelId()
          },
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
    </MenuGroupContext.Provider>
  )
}

/** Public state for {@link MenuGroup}. */
export interface MenuGroupState extends Record<string, unknown> {}

/** Props for {@link MenuGroup}. */
export type MenuGroupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<MenuGroupState, Record<string, unknown>>
}
