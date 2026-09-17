import { fieldValidityMapping } from '../../internals/field-constants/constants'

import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { NumberFieldRootState } from '../root/NumberFieldRoot'

export const stateAttributesMapping: StateAttributesMapping<NumberFieldRootState> =
  {
    inputValue: () => null,
    value: () => null,
    ...fieldValidityMapping,
  }
