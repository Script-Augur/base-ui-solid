import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import { ComboboxChipContext } from './ComboboxChipContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A chip representing one selected value in multiple mode.
 * Renders a `<div>` element.
 */
export function ComboboxChip(componentProps: ComboboxChipProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: ComboboxChipState = {}

  return (
    <ComboboxChipContext.Provider value={{}}>
      {createRender<ComboboxChipState, Record<string, unknown>>({
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
          children: local.children,
          ref: local.ref,
        }),
      })}
    </ComboboxChipContext.Provider>
  )
}

export interface ComboboxChipState extends Record<string, unknown> {}

export type ComboboxChipProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxChipState, Record<string, unknown>>
}
