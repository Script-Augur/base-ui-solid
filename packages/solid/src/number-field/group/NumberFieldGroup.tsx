import { children, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext'
import { stateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { NumberFieldRootState } from '../root/NumberFieldRoot'
import type { JSX } from 'solid-js'

/**
 * Groups the input with the increment and decrement buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldGroup(
  componentProps: NumberFieldGroupProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
    'children',
  ])

  const { state } = useNumberFieldRootContext()
  const resolvedChildren = children(() => local.children)

  return createRender<NumberFieldGroupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    stateAttributesMapping,
    ref: local.ref,
    props: mergeProps(
      {
        role: 'group',
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get children() {
          return resolvedChildren()
        },
      },
      elementProps as Record<string, unknown>
    ),
  })
}

export interface NumberFieldGroupState extends NumberFieldRootState {}

export interface NumberFieldGroupProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  render?: RenderProp<NumberFieldGroupState, Record<string, unknown>>
  children?: JSX.Element
  ref?: ((element: Element) => void) | undefined
}
