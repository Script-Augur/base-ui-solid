import { fieldValidityMapping } from '../../internals/field-constants/constants'
import { transitionStatusMapping } from '../../internals/stateAttributesMapping'

import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { RadioRootState } from '../root/RadioRoot'

/**
 * Maps radio state to `data-*` attributes (checked/unchecked + field + transition).
 */
export const stateAttributesMapping: StateAttributesMapping<
  RadioRootState & Record<string, unknown>
> = {
  checked(value: unknown): Record<string, string> {
    if (value) {
      return { 'data-checked': '' }
    }
    return { 'data-unchecked': '' }
  },
  ...transitionStatusMapping,
  ...fieldValidityMapping,
}
