export * as Autocomplete from './index.parts'

export { AutocompleteRoot } from './root/AutocompleteRoot'
export { AutocompleteValue } from './value/AutocompleteValue'
export { AutocompleteTrigger } from './trigger/AutocompleteTrigger'
export { AutocompleteTriggerDataAttributes } from './trigger/AutocompleteTriggerDataAttributes'
export { AutocompleteInputGroup } from './input-group/AutocompleteInputGroup'
export { AutocompleteInputGroupDataAttributes } from './input-group/AutocompleteInputGroupDataAttributes'
export { AutocompleteItem } from './item/AutocompleteItem'
export { AutocompleteItemDataAttributes } from './item/AutocompleteItemDataAttributes'
export { AutocompleteSeparator } from './separator/AutocompleteSeparator'
export { AutocompleteClearDataAttributes } from './clear/AutocompleteClearDataAttributes'

export { ComboboxInput as AutocompleteInput } from '../combobox/input/ComboboxInput'
export { ComboboxInputDataAttributes as AutocompleteInputDataAttributes } from '../combobox/input/ComboboxInputDataAttributes'
export { ComboboxIcon as AutocompleteIcon } from '../combobox/icon/ComboboxIcon'
export { ComboboxIconDataAttributes as AutocompleteIconDataAttributes } from '../combobox/icon/ComboboxIconDataAttributes'
export { ComboboxClear as AutocompleteClear } from '../combobox/clear/ComboboxClear'
export { ComboboxList as AutocompleteList } from '../combobox/list/ComboboxList'
export { ComboboxStatus as AutocompleteStatus } from '../combobox/status/ComboboxStatus'
export { ComboboxPortal as AutocompletePortal } from '../combobox/portal/ComboboxPortal'
export { ComboboxBackdrop as AutocompleteBackdrop } from '../combobox/backdrop/ComboboxBackdrop'
export { ComboboxPositioner as AutocompletePositioner } from '../combobox/positioner/ComboboxPositioner'
export { ComboboxPopup as AutocompletePopup } from '../combobox/popup/ComboboxPopup'
export { ComboboxArrow as AutocompleteArrow } from '../combobox/arrow/ComboboxArrow'
export { ComboboxGroup as AutocompleteGroup } from '../combobox/group/ComboboxGroup'
export { ComboboxGroupLabel as AutocompleteGroupLabel } from '../combobox/group-label/ComboboxGroupLabel'
export { ComboboxRow as AutocompleteRow } from '../combobox/row/ComboboxRow'
export { ComboboxCollection as AutocompleteCollection } from '../combobox/collection/ComboboxCollection'
export { ComboboxEmpty as AutocompleteEmpty } from '../combobox/empty/ComboboxEmpty'
export {
  useFilter,
  useComboboxFilter,
} from '../combobox/root/utils/useFilter'
export { useFilteredItems } from '../combobox/root/utils/useFilteredItems'

export type {
  AutocompleteRootProps,
  AutocompleteRootState,
  AutocompleteRootActions,
  AutocompleteRootChangeEventDetails,
  AutocompleteRootChangeEventReason,
  AutocompleteRootHighlightEventDetails,
} from './root/AutocompleteRoot'
export type {
  AutocompleteValueProps,
  AutocompleteValueState,
} from './value/AutocompleteValue'
export type {
  AutocompleteTriggerProps,
  AutocompleteTriggerState,
} from './trigger/AutocompleteTrigger'
export type {
  AutocompleteInputGroupProps,
  AutocompleteInputGroupState,
} from './input-group/AutocompleteInputGroup'
export type {
  AutocompleteItemProps,
  AutocompleteItemState,
  AutocompleteItemMetadata,
} from './item/AutocompleteItem'
export type {
  AutocompleteSeparatorProps,
  AutocompleteSeparatorState,
} from './separator/AutocompleteSeparator'
export type {
  ComboboxInputProps as AutocompleteInputProps,
  ComboboxInputState as AutocompleteInputState,
} from '../combobox/input/ComboboxInput'
export type {
  ComboboxIconProps as AutocompleteIconProps,
  ComboboxIconState as AutocompleteIconState,
} from '../combobox/icon/ComboboxIcon'
export type {
  ComboboxClearProps as AutocompleteClearProps,
  ComboboxClearState as AutocompleteClearState,
} from '../combobox/clear/ComboboxClear'
export type {
  ComboboxListProps as AutocompleteListProps,
  ComboboxListState as AutocompleteListState,
} from '../combobox/list/ComboboxList'
export type {
  ComboboxStatusProps as AutocompleteStatusProps,
  ComboboxStatusState as AutocompleteStatusState,
} from '../combobox/status/ComboboxStatus'
export type { ComboboxPortalProps as AutocompletePortalProps } from '../combobox/portal/ComboboxPortal'
export type {
  ComboboxBackdropProps as AutocompleteBackdropProps,
  ComboboxBackdropState as AutocompleteBackdropState,
} from '../combobox/backdrop/ComboboxBackdrop'
export type {
  ComboboxPositionerProps as AutocompletePositionerProps,
  ComboboxPositionerState as AutocompletePositionerState,
} from '../combobox/positioner/ComboboxPositioner'
export type {
  ComboboxPopupProps as AutocompletePopupProps,
  ComboboxPopupState as AutocompletePopupState,
} from '../combobox/popup/ComboboxPopup'
export type {
  ComboboxArrowProps as AutocompleteArrowProps,
  ComboboxArrowState as AutocompleteArrowState,
} from '../combobox/arrow/ComboboxArrow'
export type {
  ComboboxGroupProps as AutocompleteGroupProps,
  ComboboxGroupState as AutocompleteGroupState,
} from '../combobox/group/ComboboxGroup'
export type {
  ComboboxGroupLabelProps as AutocompleteGroupLabelProps,
  ComboboxGroupLabelState as AutocompleteGroupLabelState,
} from '../combobox/group-label/ComboboxGroupLabel'
export type {
  ComboboxRowProps as AutocompleteRowProps,
  ComboboxRowState as AutocompleteRowState,
} from '../combobox/row/ComboboxRow'
export type { ComboboxCollectionProps as AutocompleteCollectionProps } from '../combobox/collection/ComboboxCollection'
export type {
  ComboboxEmptyProps as AutocompleteEmptyProps,
  ComboboxEmptyState as AutocompleteEmptyState,
} from '../combobox/empty/ComboboxEmpty'
export type {
  ComboboxFilter as AutocompleteFilter,
  ComboboxFilterOptions as AutocompleteFilterOptions,
} from '../combobox/root/utils/useFilter'
