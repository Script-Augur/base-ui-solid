import { SelectScrollArrow } from '../scroll-arrow/SelectScrollArrow'

import type { RenderProp } from '../../internals/createRender'
import type { SelectScrollArrowState } from '../scroll-arrow/SelectScrollArrow'
import type { JSX } from 'solid-js'

/**
 * An element that scrolls the select popup up when pressed and held. Does not
 * indicate visibility unless the list can scroll further up.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - ScrollUpArrow props.
 * @returns A Solid JSX element, or `null` when not visible and not `keepMounted`.
 */
export function SelectScrollUpArrow(
  componentProps: SelectScrollUpArrowProps
): JSX.Element {
  return <SelectScrollArrow {...componentProps} direction="up" />
}

/** Public state for {@link SelectScrollUpArrow}. */
export type SelectScrollUpArrowState = SelectScrollArrowState

/** Props for {@link SelectScrollUpArrow}. */
export type SelectScrollUpArrowProps = Omit<
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
