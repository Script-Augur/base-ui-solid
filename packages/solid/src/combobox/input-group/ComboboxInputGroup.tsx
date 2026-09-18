import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useComboboxRootContext } from '../root/ComboboxRootContext'

import { ComboboxInputGroupDataAttributes } from './ComboboxInputGroupDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Groups the input with adjacent controls.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxInputGroup(
  componentProps: ComboboxInputGroupProps
): JSX.Element {
  const context = useComboboxRootContext()
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: ComboboxInputGroupState = {
    get open() {
      return context.open()
    },
    get disabled() {
      return context.disabled()
    },
    get readOnly() {
      return context.readOnly()
    },
    get listEmpty() {
      return context.listEmpty()
    },
  }

  return createRender<ComboboxInputGroupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: {
      open(value: unknown) {
        return value
          ? { [ComboboxInputGroupDataAttributes.popupOpen]: '' }
          : null
      },
      disabled(value: unknown) {
        return value
          ? { [ComboboxInputGroupDataAttributes.disabled]: '' }
          : null
      },
    },
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
  })
}

export interface ComboboxInputGroupState extends Record<string, unknown> {
  open: boolean
  disabled: boolean
  readOnly: boolean
  listEmpty: boolean
}

export type ComboboxInputGroupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxInputGroupState, Record<string, unknown>>
}
