export * as Combobox from './index.parts'

export { ComboboxRoot } from './root/ComboboxRoot'
export {
  ComboboxRootContext,
  useComboboxRootContext,
} from './root/ComboboxRootContext'
export { ComboboxLabel } from './label/ComboboxLabel'
export { ComboboxValue } from './value/ComboboxValue'
export { ComboboxInput } from './input/ComboboxInput'
export { ComboboxInputDataAttributes } from './input/ComboboxInputDataAttributes'
export { ComboboxInputGroup } from './input-group/ComboboxInputGroup'
export { ComboboxInputGroupDataAttributes } from './input-group/ComboboxInputGroupDataAttributes'
export { ComboboxTrigger } from './trigger/ComboboxTrigger'
export { ComboboxTriggerDataAttributes } from './trigger/ComboboxTriggerDataAttributes'
export { ComboboxList } from './list/ComboboxList'
export { ComboboxStatus } from './status/ComboboxStatus'
export { ComboboxPortal } from './portal/ComboboxPortal'
export {
  ComboboxPortalContext,
  useComboboxPortalContext,
} from './portal/ComboboxPortalContext'
export { ComboboxBackdrop } from './backdrop/ComboboxBackdrop'
export { ComboboxBackdropDataAttributes } from './backdrop/ComboboxBackdropDataAttributes'
export { ComboboxPositioner } from './positioner/ComboboxPositioner'
export {
  ComboboxPositionerContext,
  useComboboxPositionerContext,
} from './positioner/ComboboxPositionerContext'
export { ComboboxPositionerCssVars } from './positioner/ComboboxPositionerCssVars'
export { ComboboxPositionerDataAttributes } from './positioner/ComboboxPositionerDataAttributes'
export { ComboboxPopup } from './popup/ComboboxPopup'
export { ComboboxPopupDataAttributes } from './popup/ComboboxPopupDataAttributes'
export { ComboboxArrow } from './arrow/ComboboxArrow'
export { ComboboxArrowDataAttributes } from './arrow/ComboboxArrowDataAttributes'
export { ComboboxIcon } from './icon/ComboboxIcon'
export { ComboboxIconDataAttributes } from './icon/ComboboxIconDataAttributes'
export { ComboboxGroup } from './group/ComboboxGroup'
export {
  ComboboxGroupContext,
  useComboboxGroupContext,
} from './group/ComboboxGroupContext'
export { ComboboxGroupLabel } from './group-label/ComboboxGroupLabel'
export { ComboboxItem } from './item/ComboboxItem'
export {
  ComboboxItemContext,
  useComboboxItemContext,
} from './item/ComboboxItemContext'
export { ComboboxItemDataAttributes } from './item/ComboboxItemDataAttributes'
export { ComboboxItemIndicator } from './item/ComboboxItemIndicator'
export { ComboboxChips } from './chips/ComboboxChips'
export {
  ComboboxChipsContext,
  useComboboxChipsContext,
} from './chips/ComboboxChipsContext'
export { ComboboxChip } from './chip/ComboboxChip'
export {
  ComboboxChipContext,
  useComboboxChipContext,
} from './chip/ComboboxChipContext'
export { ComboboxChipRemove } from './chip-remove/ComboboxChipRemove'
export { ComboboxRow } from './row/ComboboxRow'
export { ComboboxCollection } from './collection/ComboboxCollection'
export { ComboboxEmpty } from './empty/ComboboxEmpty'
export { ComboboxClear } from './clear/ComboboxClear'
export { ComboboxClearDataAttributes } from './clear/ComboboxClearDataAttributes'
export { ComboboxSeparator } from './separator/ComboboxSeparator'
export { useFilter, useComboboxFilter } from './root/utils/useFilter'
export { useFilteredItems } from './root/utils/useFilteredItems'

export type {
  ComboboxRootProps,
  ComboboxRootState,
  ComboboxRootActions,
  ComboboxRootChangeEventDetails,
  ComboboxRootChangeEventReason,
  ComboboxRootHighlightEventDetails,
  ComboboxRootHighlightEventReason,
} from './root/ComboboxRoot'
export type { ComboboxRootContextValue } from './root/ComboboxRootContext'
export type {
  ComboboxLabelProps,
  ComboboxLabelState,
} from './label/ComboboxLabel'
export type {
  ComboboxValueProps,
  ComboboxValueState,
} from './value/ComboboxValue'
export type {
  ComboboxInputProps,
  ComboboxInputState,
} from './input/ComboboxInput'
export type {
  ComboboxInputGroupProps,
  ComboboxInputGroupState,
} from './input-group/ComboboxInputGroup'
export type {
  ComboboxTriggerProps,
  ComboboxTriggerState,
} from './trigger/ComboboxTrigger'
export type { ComboboxListProps, ComboboxListState } from './list/ComboboxList'
export type {
  ComboboxStatusProps,
  ComboboxStatusState,
} from './status/ComboboxStatus'
export type { ComboboxPortalProps } from './portal/ComboboxPortal'
export type {
  ComboboxBackdropProps,
  ComboboxBackdropState,
} from './backdrop/ComboboxBackdrop'
export type {
  ComboboxPositionerProps,
  ComboboxPositionerState,
} from './positioner/ComboboxPositioner'
export type { ComboboxPositionerContextValue } from './positioner/ComboboxPositionerContext'
export type { Side, Align } from './positioner/placement'
export type {
  ComboboxPopupProps,
  ComboboxPopupState,
} from './popup/ComboboxPopup'
export type {
  ComboboxArrowProps,
  ComboboxArrowState,
} from './arrow/ComboboxArrow'
export type { ComboboxIconProps, ComboboxIconState } from './icon/ComboboxIcon'
export type {
  ComboboxGroupProps,
  ComboboxGroupState,
} from './group/ComboboxGroup'
export type { ComboboxGroupContextValue } from './group/ComboboxGroupContext'
export type {
  ComboboxGroupLabelProps,
  ComboboxGroupLabelState,
} from './group-label/ComboboxGroupLabel'
export type {
  ComboboxItemProps,
  ComboboxItemState,
  ComboboxItemMetadata,
} from './item/ComboboxItem'
export type { ComboboxItemContextValue } from './item/ComboboxItemContext'
export type {
  ComboboxItemIndicatorProps,
  ComboboxItemIndicatorState,
} from './item/ComboboxItemIndicator'
export type {
  ComboboxChipsProps,
  ComboboxChipsState,
} from './chips/ComboboxChips'
export type { ComboboxChipsContextValue } from './chips/ComboboxChipsContext'
export type { ComboboxChipProps, ComboboxChipState } from './chip/ComboboxChip'
export type { ComboboxChipContextValue } from './chip/ComboboxChipContext'
export type {
  ComboboxChipRemoveProps,
  ComboboxChipRemoveState,
} from './chip-remove/ComboboxChipRemove'
export type { ComboboxRowProps, ComboboxRowState } from './row/ComboboxRow'
export type { ComboboxCollectionProps } from './collection/ComboboxCollection'
export type {
  ComboboxEmptyProps,
  ComboboxEmptyState,
} from './empty/ComboboxEmpty'
export type {
  ComboboxClearProps,
  ComboboxClearState,
} from './clear/ComboboxClear'
export type {
  ComboboxSeparatorProps,
  ComboboxSeparatorState,
} from './separator/ComboboxSeparator'
export type {
  ComboboxItems,
  ComboboxItemGroup,
} from './utils/resolveValueLabel'
export type {
  ComboboxFilter,
  ComboboxFilterOptions,
} from './root/utils/useFilter'
