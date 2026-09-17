import { transitionStatusMapping } from '../../internals/stateAttributesMapping'

import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'

const OPEN_HOOK = { 'data-open': '' }
const CLOSED_HOOK = { 'data-closed': '' }
const POPUP_OPEN_HOOK = { 'data-popup-open': '' }
const PRESSED_HOOK = { 'data-pressed': '' }

/**
 * Popup / content open + transition mapping.
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
 * Positioner open + side / align / instant mapping.
 */
export const positionerStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  side: Side
  align: Align
  anchorHidden: boolean
  instant?: boolean | undefined
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  anchorHidden(value) {
    return value ? { 'data-anchor-hidden': '' } : null
  },
  instant(value) {
    return value ? { 'data-instant': '' } : null
  },
}

/**
 * Popup with side / align / transition.
 */
export const navigationMenuPopupStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  transitionStatus: TransitionStatus
  side: Side
  align: Align
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  ...transitionStatusMapping,
}

/**
 * Trigger open-state mapping (`data-popup-open` / `data-pressed`).
 */
export const triggerOpenStateMapping: StateAttributesMapping<{
  open: boolean
}> = {
  open(value) {
    return value ? POPUP_OPEN_HOOK : null
  },
}

/**
 * Pressable trigger mapping used by Navigation Menu Trigger.
 */
export const pressableTriggerOpenStateMapping: StateAttributesMapping<{
  open: boolean
}> = {
  open(value) {
    return value ? { ...POPUP_OPEN_HOOK, ...PRESSED_HOOK } : null
  },
}

/**
 * Content state attributes including activation direction.
 */
export const contentStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  transitionStatus: TransitionStatus
  activationDirection: 'left' | 'right' | 'up' | 'down' | null
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  ...transitionStatusMapping,
  activationDirection(value) {
    if (!value) return null
    return { 'data-activation-direction': String(value) }
  },
}
