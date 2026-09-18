import { createUniqueId, mergeProps, onCleanup, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useComboboxGroupContext } from '../group/ComboboxGroupContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - GroupLabel props.
 * @returns A Solid JSX element.
 */
export function ComboboxGroupLabel(
  componentProps: ComboboxGroupLabelProps
): JSX.Element {
  const group = useComboboxGroupContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'id',
    'ref',
  ])

  const generatedId = createUniqueId()
  const id = () => local.id ?? generatedId

  group.labelIdAssign(id())
  onCleanup(() => {
    group.labelIdAssign(undefined)
  })

  const state: ComboboxGroupLabelState = {}

  return createRender<ComboboxGroupLabelState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return id()
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
  })
}

/** Public state for {@link ComboboxGroupLabel} (empty). */
export interface ComboboxGroupLabelState extends Record<string, unknown> {}

/** Props for {@link ComboboxGroupLabel}. */
export type ComboboxGroupLabelProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxGroupLabelState, Record<string, unknown>>
}
