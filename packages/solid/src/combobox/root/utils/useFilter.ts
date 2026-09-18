import { getFilter } from '../../../internals/filter'

import type { Filter, GetFilterParameters } from '../../../internals/filter'

/** Alias matching the public `useFilter` export name. */
export const useFilter = useComboboxFilter

/**
 * Returns a collator-backed filter for matching items against a query.
 *
 * Solid port of upstream `useComboboxFilter` — thin wrapper over cached `getFilter`.
 *
 * @param options - Collator options plus optional `locale`.
 */
export function useComboboxFilter(options: GetFilterParameters = {}): Filter {
  return getFilter(options)
}

export type {
  Filter as ComboboxFilter,
  GetFilterParameters as ComboboxFilterOptions,
}
