import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A text label of the select item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - ItemText props.
 * @returns A Solid JSX element.
 */
export function SelectItemText(
  componentProps: SelectItemTextProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: SelectItemTextState = {}

  return createRender<SelectItemTextState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get children() {
        return local.children
      },
      ref: local.ref,
    }),
  })
}

/** Public state for {@link SelectItemText} (empty). */
export interface SelectItemTextState extends Record<string, unknown> {}

/** Props for {@link SelectItemText}. */
export type SelectItemTextProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<SelectItemTextState, Record<string, unknown>>
}
