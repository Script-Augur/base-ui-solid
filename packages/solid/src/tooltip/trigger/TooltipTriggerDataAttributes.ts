/**
 * Data attributes rendered on {@link TooltipTrigger}.
 */
export enum TooltipTriggerDataAttributes {
  /**
   * Present when the corresponding tooltip is open.
   */
  popupOpen = 'data-popup-open',
  /**
   * Present when the trigger is disabled (Root or Trigger `disabled`).
   * Upstream does not set the native HTML `disabled` attribute for tooltip
   * triggers, so this is the only disabled signal exposed to CSS/tests.
   */
  triggerDisabled = 'data-trigger-disabled',
}
