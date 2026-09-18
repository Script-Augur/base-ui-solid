import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Live-region status for async lists.
 * Renders a `<div role="status">` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxStatus(
  componentProps: ComboboxStatusProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: ComboboxStatusState = {}

  return createRender<ComboboxStatusState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      role: 'status',
      'aria-live': 'polite',
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

export interface ComboboxStatusState extends Record<string, unknown> {}

export type ComboboxStatusProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxStatusState, Record<string, unknown>>
}
