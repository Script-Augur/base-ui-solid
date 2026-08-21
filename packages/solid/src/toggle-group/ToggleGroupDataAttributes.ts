/**
 * `data-*` attribute names written by {@link ToggleGroup}.
 *
 * Catalog for docs and consumers styling or querying toggle group state.
 */
export const ToggleGroupDataAttributes = {
  /**
   * Present when the toggle group is disabled.
   */
  disabled: 'data-disabled',
  /**
   * Indicates the orientation of the toggle group.
   * @type {'horizontal' | 'vertical'}
   */
  orientation: 'data-orientation',
  /**
   * Present when the toggle group allows multiple buttons to be pressed at once.
   */
  multiple: 'data-multiple',
} as const
