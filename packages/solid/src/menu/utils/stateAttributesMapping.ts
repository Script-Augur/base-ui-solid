import { transitionStatusMapping } from '../../internals/stateAttributesMapping'

import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'

const OPEN_HOOK = { 'data-open': '' }
const CLOSED_HOOK = { 'data-closed': '' }
const POPUP_OPEN_HOOK = { 'data-popup-open': '' }
const PRESSED_HOOK = { 'data-pressed': '' }
const HIGHLIGHTED_HOOK = { 'data-highlighted': '' }
const CHECKED_HOOK = { 'data-checked': '' }
const UNCHECKED_HOOK = { 'data-unchecked': '' }

/**
 * Shared by Menu.Popup / positioner-adjacent parts.
 */
export const menuPopupStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  transitionStatus: TransitionStatus
  side: Side
  align: Align
  instant?: string | undefined
  nested?: boolean
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
 * Backdrop / viewport transition mapping.
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
 * Positioner open + side / align mapping.
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
 * Trigger open-state mapping.
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

/**
 * Item highlighted / disabled mapping.
 */
export const itemStateAttributesMapping: StateAttributesMapping<{
  disabled: boolean
  highlighted: boolean
}> = {
  highlighted(value) {
    return value ? HIGHLIGHTED_HOOK : null
  },
}

/**
 * Checkbox / radio checked mapping.
 */
export const checkedStateAttributesMapping: StateAttributesMapping<{
  checked: boolean
  disabled: boolean
  highlighted: boolean
}> = {
  checked(value) {
    return value ? CHECKED_HOOK : UNCHECKED_HOOK
  },
  highlighted(value) {
    return value ? HIGHLIGHTED_HOOK : null
  },
}
