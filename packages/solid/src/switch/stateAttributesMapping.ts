import { fieldValidityMapping } from '../internals/field-constants/constants'

import type { StateAttributesMapping } from '../internals/getStateAttributesProps.types'
import type { SwitchRootState } from './root/SwitchRoot'

/**
 * Maps switch state to `data-*` attributes (checked/unchecked + field validity).
 */
export const stateAttributesMapping: StateAttributesMapping<
  SwitchRootState & Record<string, unknown>
> = {
  checked(value: unknown): Record<string, string> {
    if (value) {
      return { 'data-checked': '' }
    }
    return { 'data-unchecked': '' }
  },
  ...fieldValidityMapping,
}
