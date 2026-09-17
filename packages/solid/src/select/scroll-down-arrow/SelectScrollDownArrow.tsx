import { SelectScrollArrow } from '../scroll-arrow/SelectScrollArrow'

import type { RenderProp } from '../../internals/createRender'
import type { SelectScrollArrowState } from '../scroll-arrow/SelectScrollArrow'
import type { JSX } from 'solid-js'

/**
 * An element that scrolls the select popup down when pressed and held. Does not
 * indicate visibility unless the list can scroll further down.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - ScrollDownArrow props.
 * @returns A Solid JSX element, or `null` when not visible and not `keepMounted`.
 */
export function SelectScrollDownArrow(
  componentProps: SelectScrollDownArrowProps
): JSX.Element {
  return <SelectScrollArrow {...componentProps} direction="down" />
}

/** Public state for {@link SelectScrollDownArrow}. */
export type SelectScrollDownArrowState = SelectScrollArrowState

/** Props for {@link SelectScrollDownArrow}. */
export type SelectScrollDownArrowProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  children?: JSX.Element
  /**
   * Whether to keep the HTML element in the DOM while the select popup is not scrollable.
   * @default false
   */
  keepMounted?: boolean
  render?: RenderProp<SelectScrollArrowState, Record<string, unknown>>
}
