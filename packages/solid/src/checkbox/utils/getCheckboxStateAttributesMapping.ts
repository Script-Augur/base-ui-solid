import { fieldValidityMapping } from '../../internals/field-constants/constants'

import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { CheckboxRootState } from '../root/CheckboxRoot'

/**
 * Maps checkbox state to `data-*` attributes (checked/unchecked + field validity).
 *
 * When `indeterminate` is set, `data-checked` / `data-unchecked` are omitted —
 * `data-indeterminate` is written from the `indeterminate` state key instead.
 *
 * @param state - Current checkbox root state (needs `indeterminate` for the mapping).
 * @returns State attribute mapping for Root / Indicator.
 */
export function getCheckboxStateAttributesMapping(
  state: CheckboxRootState
): StateAttributesMapping<CheckboxRootState & Record<string, unknown>> {
  return {
    checked(value: unknown): Record<string, string> {
      if (state.indeterminate) {
        // `data-indeterminate` is already handled by the `indeterminate` prop.
        return {}
      }
      if (value) {
        return { 'data-checked': '' }
      }
      return { 'data-unchecked': '' }
    },
    ...fieldValidityMapping,
  }
}
