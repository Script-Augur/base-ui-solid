import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useComboboxRootContext } from '../root/ComboboxRootContext'
import { comboboxTriggerOpenStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An icon that indicates that the trigger button opens a combobox popup.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Icon props.
 * @returns A Solid JSX element.
 */
export function ComboboxIcon(componentProps: ComboboxIconProps): JSX.Element {
  const context = useComboboxRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: ComboboxIconState = {
    get open() {
      return context.open()
    },
  }

  return createRender<ComboboxIconState, Record<string, unknown>>({
    defaultElement: 'span',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: comboboxTriggerOpenStateMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      'aria-hidden': true,
      get children() {
        return local.children ?? '\u25BC'
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      ref: local.ref,
    }),
  })
}

/** Public state for {@link ComboboxIcon}. */
export interface ComboboxIconState extends Record<string, unknown> {
  open: boolean
}

/** Props for {@link ComboboxIcon}. */
export type ComboboxIconProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  render?: RenderProp<ComboboxIconState, Record<string, unknown>>
}
