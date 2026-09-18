import { createSignal, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import { ComboboxGroupContext } from './ComboboxGroupContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Groups related combobox items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Group props.
 * @returns A Solid JSX element.
 */
export function ComboboxGroup(componentProps: ComboboxGroupProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const [labelId, labelIdAssign] = createSignal<string | undefined>()

  const state: ComboboxGroupState = {}

  return (
    <ComboboxGroupContext.Provider value={{ labelId, labelIdAssign }}>
      {createRender<ComboboxGroupState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
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
          get children() {
            return local.children
          },
          ref: local.ref,
        }),
      })}
    </ComboboxGroupContext.Provider>
  )
}

/** Public state for {@link ComboboxGroup} (empty). */
export interface ComboboxGroupState extends Record<string, unknown> {}

/** Props for {@link ComboboxGroup}. */
export type ComboboxGroupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxGroupState, Record<string, unknown>>
}
