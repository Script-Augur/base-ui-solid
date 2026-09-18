import { createUniqueId, mergeProps, onCleanup, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useSelectGroupContext } from '../group/SelectGroupContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - GroupLabel props.
 * @returns A Solid JSX element.
 */
export function SelectGroupLabel(
  componentProps: SelectGroupLabelProps
): JSX.Element {
  const group = useSelectGroupContext()

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

  const state: SelectGroupLabelState = {}

  return createRender<SelectGroupLabelState, Record<string, unknown>>({
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

/** Public state for {@link SelectGroupLabel} (empty). */
export interface SelectGroupLabelState extends Record<string, unknown> {}

/** Props for {@link SelectGroupLabel}. */
export type SelectGroupLabelProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<SelectGroupLabelState, Record<string, unknown>>
}
