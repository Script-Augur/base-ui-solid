import { createContext, useContext } from 'solid-js'

import type { ComboboxRootChangeEventDetails } from './ComboboxRoot'
import type { ChangeEventReason } from '../../internals/createChangeEventDetails'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { ComboboxItems } from '../utils/resolveValueLabel'
import type { Accessor, Setter } from 'solid-js'

/**
 * Shared Combobox root state for compound parts.
 */
export const ComboboxRootContext = createContext<ComboboxRootContextValue>()

/**
 * Reads the nearest {@link ComboboxRoot} context.
 *
 * @returns Context value.
 * @throws If used outside `<Combobox.Root>`.
 */
export function useComboboxRootContext(): ComboboxRootContextValue {
  const context = useContext(ComboboxRootContext)
  if (context == null) {
    throw new Error(
      'Base UI: Combobox parts must be used within <Combobox.Root>.'
    )
  }
  return context
}

/**
 * Context value published by {@link ComboboxRoot}.
 */
export interface ComboboxRootContextValue<TValue = unknown> {
  id: Accessor<string>
  open: Accessor<boolean>
  openAssign: (next: boolean) => void
  setOpen: (next: boolean, eventDetails: ComboboxRootChangeEventDetails) => void
  mounted: Accessor<boolean>
  mountedAssign: Setter<boolean>
  transitionStatus: Accessor<TransitionStatus>
  value: Accessor<TValue | Array<TValue> | null>
  setValue: (
    next: TValue | Array<TValue> | null,
    eventDetails: ComboboxRootChangeEventDetails
  ) => void
  inputValue: Accessor<string>
  setInputValue: (
    next: string,
    eventDetails: ComboboxRootChangeEventDetails
  ) => void
  multiple: Accessor<boolean>
  modal: Accessor<boolean>
  disabled: Accessor<boolean>
  readOnly: Accessor<boolean>
  required: Accessor<boolean>
  name: Accessor<string | undefined>
  form: Accessor<string | undefined>
  items: Accessor<ComboboxItems<TValue> | undefined>
  filteredItems: Accessor<ReadonlyArray<unknown> | undefined>
  itemToStringLabel: Accessor<((item: TValue) => string) | undefined>
  itemToStringValue: Accessor<((item: TValue) => string) | undefined>
  isItemEqualToValue: Accessor<(itemValue: TValue, value: TValue) => boolean>
  highlightItemOnHover: Accessor<boolean>
  openOnInputClick: Accessor<boolean>
  autoHighlight: Accessor<boolean>
  loopFocus: Accessor<boolean>
  listEmpty: Accessor<boolean>
  matchesQuery: (itemValue: unknown, labelHint?: string) => boolean
  registerVisibleItem: (id: string) => void
  unregisterVisibleItem: (id: string) => void
  visibleItemCount: Accessor<number>
  /** Controlled composite highlight index (`-1` = none). */
  highlightedIndex: Accessor<number>
  /**
   * Sets the highlighted option index and optionally notifies
   * `onItemHighlighted`.
   */
  setHighlightedIndex: (
    index: number,
    reason: 'keyboard' | 'pointer' | 'none',
    event?: Event
  ) => void
  /**
   * Moves highlight among visible options without focusing them (Input-driven
   * virtual focus).
   */
  moveHighlight: (delta: 1 | -1, event: Event) => void
  /** Activates the highlighted visible option (Enter from Input). */
  activateHighlighted: (event: Event) => void
  /** `id` of the highlighted option for `aria-activedescendant`. */
  activeDescendantId: Accessor<string | undefined>
  /** Registers an option's value by DOM id (for highlight callbacks / Enter). */
  registerItemValue: (id: string, itemValue: unknown) => void
  unregisterItemValue: (id: string) => void
  labelId: Accessor<string | undefined>
  labelIdAssign: Setter<string | undefined>
  inputElement: Accessor<HTMLInputElement | null>
  inputElementAssign: Setter<HTMLInputElement | null>
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
  onOpenChangeComplete?: (open: boolean) => void
  fillInputFromValue: (itemValue: unknown) => string
}
