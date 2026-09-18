import { createContext, useContext } from 'solid-js'

import type { SelectRootChangeEventDetails } from './SelectRoot'
import type { ChangeEventReason } from '../../internals/createChangeEventDetails'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { SelectItems } from '../utils/resolveValueLabel'
import type { Accessor, Setter } from 'solid-js'

/**
 * Shared Select root state for compound parts.
 */
export const SelectRootContext = createContext<SelectRootContextValue>()

/**
 * Reads the nearest {@link SelectRoot} context.
 *
 * @returns Context value.
 * @throws If used outside `<Select.Root>`.
 */
export function useSelectRootContext(): SelectRootContextValue {
  const context = useContext(SelectRootContext)
  if (context == null) {
    throw new Error('Base UI: Select parts must be used within <Select.Root>.')
  }
  return context
}

/**
 * Context value published by {@link SelectRoot}.
 */
export interface SelectRootContextValue<TValue = unknown> {
  id: Accessor<string>
  open: Accessor<boolean>
  openAssign: (next: boolean) => void
  setOpen: (next: boolean, eventDetails: SelectRootChangeEventDetails) => void
  mounted: Accessor<boolean>
  mountedAssign: Setter<boolean>
  transitionStatus: Accessor<TransitionStatus>
  value: Accessor<TValue | Array<TValue> | null>
  setValue: (
    next: TValue | Array<TValue> | null,
    eventDetails: SelectRootChangeEventDetails
  ) => void
  multiple: Accessor<boolean>
  modal: Accessor<boolean>
  disabled: Accessor<boolean>
  readOnly: Accessor<boolean>
  required: Accessor<boolean>
  name: Accessor<string | undefined>
  form: Accessor<string | undefined>
  items: Accessor<SelectItems<TValue> | undefined>
  itemToStringLabel: Accessor<((item: TValue) => string) | undefined>
  itemToStringValue: Accessor<((item: TValue) => string) | undefined>
  isItemEqualToValue: Accessor<(itemValue: TValue, value: TValue) => boolean>
  highlightItemOnHover: Accessor<boolean>
  labelId: Accessor<string | undefined>
  labelIdAssign: Setter<string | undefined>
  triggerElement: Accessor<HTMLElement | null>
  triggerElementAssign: Setter<HTMLElement | null>
  positionerElement: Accessor<HTMLElement | null>
  positionerElementAssign: Setter<HTMLElement | null>
  popupElement: Accessor<HTMLElement | null>
  popupElementAssign: Setter<HTMLElement | null>
  listElement: Accessor<HTMLElement | null>
  listElementAssign: Setter<HTMLElement | null>
  arrowElement: Accessor<HTMLElement | null>
  arrowElementAssign: Setter<HTMLElement | null>
  backdropElement: Accessor<HTMLElement | null>
  backdropElementAssign: Setter<HTMLElement | null>
  internalBackdropElement: Accessor<HTMLElement | null>
  internalBackdropElementAssign: Setter<HTMLElement | null>
  portalId: Accessor<string>
  openChangeReason: Accessor<ChangeEventReason | null>
  instantType: Accessor<string | undefined>
  scrollUpVisible: Accessor<boolean>
  scrollUpVisibleAssign: Setter<boolean>
  scrollDownVisible: Accessor<boolean>
  scrollDownVisibleAssign: Setter<boolean>
  updateScrollArrowVisibility: (scroller: HTMLElement | null) => void
  onOpenChangeComplete?: (open: boolean) => void
}
