import { createMemo, splitProps } from 'solid-js'

import { ComboboxRoot } from '../../combobox/root/ComboboxRoot'

import type {
  ComboboxRootActions,
  ComboboxRootChangeEventDetails,
  ComboboxRootHighlightEventDetails,
} from '../../combobox/root/ComboboxRoot'
import type { ComboboxItems } from '../../combobox/utils/resolveValueLabel'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Thin façade over {@link ComboboxRoot} with `selectionMode: 'none'`, mapping
 * public `value` / `onValueChange` to the Combobox input-value API (mirrors
 * upstream Autocomplete → AriaCombobox).
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 *
 * @param componentProps - Root props (`value`, `mode`, …).
 * @returns Combobox root configured for autocomplete semantics.
 */
export function AutocompleteRoot<TItem = unknown>(
  componentProps: AutocompleteRootProps<TItem>
): JSX.Element {
  const [local, other] = splitProps(
    componentProps as AutocompleteRootProps<unknown> & Record<string, unknown>,
    [
      'openOnInputClick',
      'value',
      'defaultValue',
      'onValueChange',
      'mode',
      'itemToStringValue',
      'autoHighlight',
      'keepHighlight',
      'submitOnItemClick',
      'inline',
      'filter',
    ]
  )

  // Lite: accept but do not implement inline autocompletion / form submit.
  void local.keepHighlight
  void local.submitOnItemClick
  void local.inline

  const resolvedFilter = createMemo(() => {
    const m = local.mode ?? 'list'
    if (m === 'inline' || m === 'none') return null
    return local.filter
  })

  const autoHighlight = createMemo(() => {
    const value = local.autoHighlight
    if (value === 'always') return true
    return Boolean(value)
  })

  return (
    <ComboboxRoot
      {...other}
      selectionMode="none"
      fillInputOnItemPress
      openOnInputClick={local.openOnInputClick ?? false}
      itemToStringLabel={local.itemToStringValue}
      itemToStringValue={local.itemToStringValue}
      inputValue={local.value}
      defaultInputValue={local.defaultValue}
      onInputValueChange={local.onValueChange}
      filter={resolvedFilter()}
      autoHighlight={autoHighlight()}
      inline={local.inline}
    />
  )
}

/** Public state for {@link AutocompleteRoot} (empty — root has no element). */
export interface AutocompleteRootState {}

/** Imperative actions exposed via `actionsRef`. */
export interface AutocompleteRootActions extends ComboboxRootActions {}

/** Change-event reason for Autocomplete (same as Combobox). */
export type AutocompleteRootChangeEventReason =
  ComboboxRootChangeEventDetails['reason']

/** Change-event details for Autocomplete. */
export type AutocompleteRootChangeEventDetails = ComboboxRootChangeEventDetails

/** Highlight-event details for Autocomplete. */
export type AutocompleteRootHighlightEventDetails =
  ComboboxRootHighlightEventDetails

/**
 * Props for {@link AutocompleteRoot}.
 *
 * `value` / `defaultValue` / `onValueChange` refer to the **input string**, not
 * a selected item (unlike Combobox).
 */
export interface AutocompleteRootProps<TItem = unknown> {
  children?: JSX.Element
  id?: string | undefined
  /**
   * Controls list filtering vs inline autocompletion.
   * Lite fully supports `'list'` (default). `'both' | 'inline' | 'none'` are
   * accepted: static modes disable filtering; inline preview is deferred.
   * @default 'list'
   */
  mode?: 'list' | 'both' | 'inline' | 'none' | undefined
  /**
   * Whether the list is rendered inline without the component's own popup.
   * Lite no-op — accepted for API parity.
   * @default false
   */
  inline?: boolean | undefined
  /**
   * Whether the first matching item is highlighted automatically.
   * `'always'` is treated like `true` in Lite (full `'always'` deferred).
   * @default false
   */
  autoHighlight?: boolean | 'always' | undefined
  /**
   * Whether the highlighted item should be preserved when the pointer leaves
   * the list. Lite no-op.
   * @default false
   */
  keepHighlight?: boolean | undefined
  /**
   * Whether moving the pointer over items should highlight them.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined
  /** Uncontrolled input value. */
  defaultValue?: string | number | ReadonlyArray<string> | undefined
  /** Controlled input value. */
  value?: string | number | ReadonlyArray<string> | undefined
  /** Called when the input value changes. */
  onValueChange?:
    | ((
        value: string,
        eventDetails: AutocompleteRootChangeEventDetails
      ) => void)
    | undefined
  /**
   * Whether clicking an item should submit the owning form.
   * Lite no-op — accepted for API parity.
   * @default false
   */
  submitOnItemClick?: boolean | undefined
  /**
   * Converts object item values to a string for the input and form submission.
   */
  itemToStringValue?: ((itemValue: TItem) => string) | undefined
  actionsRef?: AutocompleteRootActions | undefined
  onOpenChange?:
    | ((
        open: boolean,
        eventDetails: AutocompleteRootChangeEventDetails
      ) => void)
    | undefined
  onItemHighlighted?:
    | ((
        highlightedValue: TItem | undefined,
        eventDetails: AutocompleteRootHighlightEventDetails
      ) => void)
    | undefined
  /**
   * Whether the popup opens when clicking the input.
   * @default false
   */
  openOnInputClick?: boolean | undefined
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChangeComplete?: ((open: boolean) => void) | undefined
  form?: string | undefined
  name?: string | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  /**
   * Whether the popup enters a modal state when open.
   * @default false
   */
  modal?: boolean | undefined
  items?: ComboboxItems<TItem> | undefined
  filteredItems?: ReadonlyArray<unknown> | undefined
  filter?:
    | null
    | ((
        itemValue: TItem,
        query: string,
        itemToString?: (itemValue: TItem) => string
      ) => boolean)
    | undefined
  limit?: number | undefined
  locale?: Intl.LocalesArgument | undefined
  loopFocus?: boolean | undefined
  inputRef?:
    | ((element: HTMLInputElement | null) => void)
    | { current: HTMLInputElement | null }
    | undefined
  grid?: boolean | undefined
  virtualized?: boolean | undefined
}
