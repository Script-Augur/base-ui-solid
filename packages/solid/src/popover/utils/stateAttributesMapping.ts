import { transitionStatusMapping } from '../../internals/stateAttributesMapping'

import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'

const OPEN_HOOK = { 'data-open': '' }
const CLOSED_HOOK = { 'data-closed': '' }
const POPUP_OPEN_HOOK = { 'data-popup-open': '' }
const PRESSED_HOOK = { 'data-pressed': '' }

/**
 * Shared by `Popover.Popup` / positioner-adjacent parts that expose open +
 * transition + side / align.
 */
export const popoverPopupStateAttributesMapping: StateAttributesMapping<{
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
 * Backdrop transition mapping (open + transitionStatus only).
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
 * Positioner open + side / align / anchorHidden mapping.
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
 * Trigger open-state mapping (`data-popup-open` / `data-pressed`).
 */
export const triggerOpenStateMapping: StateAttributesMapping<{
  open: boolean
  disabled: boolean
  pressed?: boolean
}> = {
  open(value) {
    return value ? POPUP_OPEN_HOOK : null
  },
  pressed(value) {
    return value ? PRESSED_HOOK : null
  },
}
