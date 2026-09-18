import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { comboboxTransitionStateMapping } from '../utils/stateAttributesMapping'

import { useComboboxItemContext } from '../item/ComboboxItemContext'

import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * Indicates whether the combobox item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - ItemIndicator props (`keepMounted`, …).
 * @returns A Solid JSX element, or `null` when not selected and not `keepMounted`.
 */
export function ComboboxItemIndicator(
  componentProps: ComboboxItemIndicatorProps
): JSX.Element {
  const item = useComboboxItemContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'keepMounted',
    'ref',
  ])

  const shouldRender = () => local.keepMounted || item.selected()

  const state: ComboboxItemIndicatorState = {
    get selected() {
      return item.selected()
    },
  }

  return (
    <Show when={shouldRender()}>
      {createRender<ComboboxItemIndicatorState, Record<string, unknown>>({
        defaultElement: 'span',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping:
          comboboxTransitionStateMapping as StateAttributesMapping<ComboboxItemIndicatorState>,
        props: mergeProps(elementProps as Record<string, unknown>, {
          'aria-hidden': true,
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get children() {
            return local.children ?? '✔️'
          },
          ref: local.ref,
        }),
      })}
    </Show>
  )
}

/** Public state for {@link ComboboxItemIndicator}. */
export interface ComboboxItemIndicatorState extends Record<string, unknown> {
  selected: boolean
}

/** Props for {@link ComboboxItemIndicator}. */
export type ComboboxItemIndicatorProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   * @default false
   */
  keepMounted?: boolean
  render?: RenderProp<ComboboxItemIndicatorState, Record<string, unknown>>
}
