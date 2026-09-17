import { fieldValidityMapping } from '../../internals/field-constants/constants'

import type { SliderRootState } from './SliderRoot'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'

const nullMapping = (): null => null

/**
 * Maps slider root state to `data-*` attributes (dragging/orientation + field validity).
 */
export const sliderStateAttributesMapping: StateAttributesMapping<SliderRootState> =
  {
    activeThumbIndex: nullMapping,
    max: nullMapping,
    min: nullMapping,
    minStepsBetweenValues: nullMapping,
    step: nullMapping,
    values: nullMapping,
    ...fieldValidityMapping,
  }
