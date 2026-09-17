export * as Checkbox from './index.parts'

export { CheckboxRoot, PARENT_CHECKBOX } from './root/CheckboxRoot'
export { CheckboxRootDataAttributes } from './root/CheckboxRootDataAttributes'
export {
  CheckboxRootContext,
  useCheckboxRootContext,
} from './root/CheckboxRootContext'
export { CheckboxIndicator } from './indicator/CheckboxIndicator'
export { CheckboxIndicatorDataAttributes } from './indicator/CheckboxIndicatorDataAttributes'

export type {
  CheckboxRootProps,
  CheckboxRootState,
  CheckboxRootChangeEventReason,
  CheckboxRootChangeEventDetails,
} from './root/CheckboxRoot'
export type { CheckboxRootContextValue } from './root/CheckboxRootContext'
export type {
  CheckboxIndicatorProps,
  CheckboxIndicatorState,
} from './indicator/CheckboxIndicator'
