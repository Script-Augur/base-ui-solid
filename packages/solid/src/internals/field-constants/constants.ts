import type { FieldRootState } from '../../field/root/FieldRoot'
import type { StateAttributesMapping } from '../getStateAttributesProps.types'

/** Default {@link ValidityState}-shaped object before the first validation pass. */
export const DEFAULT_VALIDITY_STATE = {
  badInput: false,
  customError: false,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valid: null as boolean | null,
  valueMissing: false,
}

/** Default field state attributes used when no Field root is present. */
export const DEFAULT_FIELD_STATE_ATTRIBUTES: Pick<
  FieldRootState,
  'valid' | 'touched' | 'dirty' | 'filled' | 'focused'
> = {
  valid: null,
  touched: false,
  dirty: false,
  filled: false,
  focused: false,
}

/** Default {@link FieldRootState} for fallback context consumers. */
export const DEFAULT_FIELD_ROOT_STATE: FieldRootState = {
  disabled: false,
  ...DEFAULT_FIELD_STATE_ATTRIBUTES,
}

/**
 * Maps `valid` to `data-valid` / `data-invalid` (null yields no attribute).
 */
export const fieldValidityMapping: StateAttributesMapping<
  Record<string, unknown>
> = {
  valid(value: unknown): Record<string, string> | null {
    if (value === null) {
      return null
    }
    if (value) {
      return { 'data-valid': '' }
    }
    return { 'data-invalid': '' }
  },
}
