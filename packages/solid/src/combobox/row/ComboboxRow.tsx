import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A grid row for `grid` mode (Lite: presentational only).
 * Renders a `<div role="row">` element.
 */
export function ComboboxRow(componentProps: ComboboxRowProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: ComboboxRowState = {}

  return createRender<ComboboxRowState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      role: 'row',
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

export interface ComboboxRowState extends Record<string, unknown> {}

export type ComboboxRowProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxRowState, Record<string, unknown>>
}
