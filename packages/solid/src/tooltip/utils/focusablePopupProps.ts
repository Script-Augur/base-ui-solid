/**
 * Props that mark the tooltip popup as a focusable floating surface.
 *
 * Mirrors upstream `FOCUSABLE_POPUP_PROPS` so focus can move into the popup
 * (e.g. links inside the tooltip) without the trigger blur path treating that
 * as a leave.
 */
export const FOCUSABLE_POPUP_PROPS = {
  tabIndex: -1,
  'data-base-ui-focusable': '',
} as const
