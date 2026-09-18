import { mergeProps, splitProps } from 'solid-js'

import { useDialogRootContext } from '../../dialog/root/DialogRootContext'
import { createRender } from '../../internals/createRender'

import { DRAWER_CONTENT_ATTRIBUTE } from './DrawerContentDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A container for the drawer contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param componentProps - Content props.
 * @returns A Solid JSX element.
 */
export function DrawerContent(componentProps: DrawerContentProps): JSX.Element {
  useDialogRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: DrawerContentState = {}

  return createRender<DrawerContentState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: false,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get [DRAWER_CONTENT_ATTRIBUTE]() {
        return ''
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
  })
}

/** Public state for {@link DrawerContent}. */
export interface DrawerContentState extends Record<string, unknown> {}

/** Props for {@link DrawerContent}. */
export type DrawerContentProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<DrawerContentState, Record<string, unknown>>
}
