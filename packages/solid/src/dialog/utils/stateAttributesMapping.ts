import { transitionStatusMapping } from '../../internals/stateAttributesMapping'

import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'

const OPEN_HOOK = { 'data-open': '' }
const CLOSED_HOOK = { 'data-closed': '' }
const POPUP_OPEN_HOOK = { 'data-popup-open': '' }
const NESTED_OPEN_HOOK = { 'data-nested-dialog-open': '' }

/**
 * Shared by `Dialog.Popup` and `Dialog.Viewport`.
 * `nested` is unmapped — boolean `true` already renders as `data-nested`.
 */
export const dialogStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  transitionStatus: TransitionStatus
  nested: boolean
  nestedDialogOpen: boolean
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  ...transitionStatusMapping,
  nestedDialogOpen(value) {
    return value ? NESTED_OPEN_HOOK : null
  },
}

/**
 * Backdrop / popup transition mapping (open + transitionStatus only).
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
 * Trigger open-state mapping (`data-popup-open`).
 */
export const triggerOpenStateMapping: StateAttributesMapping<{
  open: boolean
  disabled: boolean
}> = {
  open(value) {
    return value ? POPUP_OPEN_HOOK : null
  },
}
