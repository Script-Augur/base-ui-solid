export * as Slider from './index.parts'

export { SliderRoot } from './root/SliderRoot'
export {
  SliderRootContext,
  useSliderRootContext,
} from './root/SliderRootContext'
export { SliderRootDataAttributes } from './root/SliderRootDataAttributes'
export { SliderLabel } from './label/SliderLabel'
export { SliderLabelDataAttributes } from './label/SliderLabelDataAttributes'
export { SliderValue } from './value/SliderValue'
export { SliderValueDataAttributes } from './value/SliderValueDataAttributes'
export { SliderControl } from './control/SliderControl'
export { SliderControlDataAttributes } from './control/SliderControlDataAttributes'
export { SliderTrack } from './track/SliderTrack'
export { SliderTrackDataAttributes } from './track/SliderTrackDataAttributes'
export { SliderThumb } from './thumb/SliderThumb'
export { SliderThumbDataAttributes } from './thumb/SliderThumbDataAttributes'
export { SliderIndicator } from './indicator/SliderIndicator'
export { SliderIndicatorDataAttributes } from './indicator/SliderIndicatorDataAttributes'

export type {
  SliderRootProps,
  SliderRootState,
  SliderRootChangeEventDetails,
  SliderRootChangeEventReason,
  SliderRootCommitEventDetails,
  SliderRootCommitEventReason,
} from './root/SliderRoot'
export type { SliderRootContextValue } from './root/SliderRootContext'
export type { SliderLabelProps, SliderLabelState } from './label/SliderLabel'
export type { SliderValueProps, SliderValueState } from './value/SliderValue'
export type {
  SliderControlProps,
  SliderControlState,
} from './control/SliderControl'
export type { SliderTrackProps, SliderTrackState } from './track/SliderTrack'
export type {
  SliderThumbProps,
  SliderThumbState,
  ThumbMetadata,
} from './thumb/SliderThumb'
export type {
  SliderIndicatorProps,
  SliderIndicatorState,
} from './indicator/SliderIndicator'
