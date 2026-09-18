import { useComboboxRootContext } from '../ComboboxRootContext'

/**
 * Reads the filtered items list from the nearest Combobox root.
 *
 * @returns Filtered items (or empty array when none).
 */
export function useFilteredItems(): ReadonlyArray<unknown> {
  const context = useComboboxRootContext()
  return context.filteredItems() ?? []
}
