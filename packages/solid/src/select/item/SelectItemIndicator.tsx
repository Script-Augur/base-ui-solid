import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { selectTransitionStateMapping } from '../utils/stateAttributesMapping'

import { useSelectItemContext } from './SelectItemContext'

import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * Indicates whether the select item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - ItemIndicator props (`keepMounted`, …).
 * @returns A Solid JSX element, or `null` when not selected and not `keepMounted`.
 */
export function SelectItemIndicator(
  componentProps: SelectItemIndicatorProps
): JSX.Element {
  const item = useSelectItemContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'keepMounted',
    'ref',
  ])

  const shouldRender = () => local.keepMounted || item.selected()

  const state: SelectItemIndicatorState = {
    get selected() {
      return item.selected()
    },
  }

  return (
    <Show when={shouldRender()}>
      {createRender<SelectItemIndicatorState, Record<string, unknown>>({
        defaultElement: 'span',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping:
          selectTransitionStateMapping as StateAttributesMapping<SelectItemIndicatorState>,
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

/** Public state for {@link SelectItemIndicator}. */
export interface SelectItemIndicatorState extends Record<string, unknown> {
  selected: boolean
}

/** Props for {@link SelectItemIndicator}. */
export type SelectItemIndicatorProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   * @default false
   */
  keepMounted?: boolean
  render?: RenderProp<SelectItemIndicatorState, Record<string, unknown>>
}
