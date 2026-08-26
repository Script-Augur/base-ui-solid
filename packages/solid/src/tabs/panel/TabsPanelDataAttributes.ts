/**
 * `data-*` attribute names written by {@link TabsPanel}.
 */
export const TabsPanelDataAttributes = {
  /** Index of the tab panel in document order. */
  index: 'data-index',
  /** Direction of tab activation relative to the previous active tab. */
  activationDirection: 'data-activation-direction',
  /** Layout orientation of the tabs. */
  orientation: 'data-orientation',
  /** Present when the panel is hidden. */
  hidden: 'data-hidden',
} as const
