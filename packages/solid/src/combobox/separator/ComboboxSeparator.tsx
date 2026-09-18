import { Separator } from '../../separator/Separator'

import type { SeparatorProps, SeparatorState } from '../../separator/Separator'
import type { JSX } from 'solid-js'

/**
 * A visual separator between items or groups.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Separator props (`orientation`, …).
 * @returns A Solid JSX element.
 */
export function ComboboxSeparator(
  componentProps: ComboboxSeparatorProps
): JSX.Element {
  return <Separator {...componentProps} />
}

/** Public state for {@link ComboboxSeparator}. */
export type ComboboxSeparatorState = SeparatorState

/** Props for {@link ComboboxSeparator}. */
export type ComboboxSeparatorProps = SeparatorProps
