import { createSignal, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import { SelectGroupContext } from './SelectGroupContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Groups related select items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Group props.
 * @returns A Solid JSX element.
 */
export function SelectGroup(componentProps: SelectGroupProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const [labelId, labelIdAssign] = createSignal<string | undefined>()

  const state: SelectGroupState = {}

  return (
    <SelectGroupContext.Provider value={{ labelId, labelIdAssign }}>
      {createRender<SelectGroupState, Record<string, unknown>>({
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
    </SelectGroupContext.Provider>
  )
}

/** Public state for {@link SelectGroup} (empty). */
export interface SelectGroupState extends Record<string, unknown> {}

/** Props for {@link SelectGroup}. */
export type SelectGroupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<SelectGroupState, Record<string, unknown>>
}
