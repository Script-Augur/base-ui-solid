import { Separator } from '../../separator/Separator'

import type { SeparatorProps, SeparatorState } from '../../separator/Separator'
import type { JSX } from 'solid-js'

/**
 * A visual separator between items or groups.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Separator props (`orientation`, …).
 * @returns A Solid JSX element.
 */
export function SelectSeparator(
  componentProps: SelectSeparatorProps
): JSX.Element {
  return <Separator {...componentProps} />
}

/** Public state for {@link SelectSeparator}. */
export type SelectSeparatorState = SeparatorState

/** Props for {@link SelectSeparator}. */
export type SelectSeparatorProps = SeparatorProps
