import { transitionStatusMapping } from '../../internals/stateAttributesMapping'

import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'

const OPEN_HOOK = { 'data-open': '' }
const CLOSED_HOOK = { 'data-closed': '' }
const POPUP_OPEN_HOOK = { 'data-popup-open': '' }
const TRIGGER_DISABLED_HOOK = { 'data-trigger-disabled': '' }

/**
 * Shared by `Tooltip.Popup` — open + transition + side / align + instant.
 */
export const tooltipPopupStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  transitionStatus: TransitionStatus
  side: Side
  align: Align
  instant?: string | undefined
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  ...transitionStatusMapping,
  instant(value) {
    return value ? { 'data-instant': String(value) } : null
  },
}

/**
 * Viewport transition mapping (open + transitionStatus only).
 */
export const popupTransitionStateMapping: StateAttributesMapping<{
  open: boolean
  transitionStatus: TransitionStatus
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  ...transitionStatusMapping,
}

/**
 * Positioner open + side / align / anchorHidden / instant mapping.
 */
export const positionerStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  side: Side
  align: Align
  anchorHidden: boolean
  instant?: string | undefined
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  anchorHidden(value) {
    return value ? { 'data-anchor-hidden': '' } : null
  },
  instant(value) {
    return value ? { 'data-instant': String(value) } : null
  },
}

/**
 * Trigger open / disabled mapping (`data-popup-open` / `data-trigger-disabled`).
 *
 * Upstream Tooltip.Trigger does not set the native HTML `disabled` attribute
 * (it must remain focusable/hoverable to close nested state) — `disabled`
 * surfaces only as `data-trigger-disabled`.
 */
export const triggerOpenStateMapping: StateAttributesMapping<{
  open: boolean
  disabled: boolean
}> = {
  open(value) {
    return value ? POPUP_OPEN_HOOK : null
  },
  disabled(value) {
    return value ? TRIGGER_DISABLED_HOOK : null
  },
}

/**
 * Arrow open / uncentered mapping.
 */
export const arrowStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  uncentered: boolean
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  uncentered(value) {
    return value ? { 'data-uncentered': '' } : null
  },
}
