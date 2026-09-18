import { useComboboxRootContext } from '../ComboboxRootContext'

import type { Accessor } from 'solid-js'

/**
 * Reads the filtered items list from the nearest Combobox root.
 *
 * Returns an {@link Accessor} so Solid tracks updates when `inputValue` /
 * `items` / `filteredItems` change. Call it inside a tracking scope
 * (JSX, `createMemo`, `createEffect`) — do not snapshot once at setup.
 *
 * @returns Accessor of the filtered items array (empty when none).
 */
export function useFilteredItems(): Accessor<ReadonlyArray<unknown>> {
  const context = useComboboxRootContext()
  return () => context.filteredItems() ?? []
}
