/**
 * Present on the autocomplete item element.
 * Autocomplete items are not persistently selected (no `data-selected`).
 */
export enum AutocompleteItemDataAttributes {
  /**
   * Present when the item is highlighted.
   */
  highlighted = 'data-highlighted',
  /**
   * Present when the item is disabled.
   */
  disabled = 'data-disabled',
}
