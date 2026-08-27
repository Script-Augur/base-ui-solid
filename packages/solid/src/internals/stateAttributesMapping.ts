import type { TransitionStatus } from './createTransitionStatus'

const STARTING_HOOK = { 'data-starting-style': '' }
const ENDING_HOOK = { 'data-ending-style': '' }
/**
 * Maps {@link TransitionStatus} to Base UI transition data attributes.
 */
export const transitionStatusMapping = {
  transitionStatus(value: TransitionStatus): Record<string, string> | null {
    return value === 'starting'
      ? STARTING_HOOK
      : value === 'ending'
        ? ENDING_HOOK
        : null
  },
}
/**
 * Data attributes emitted for open/close CSS transitions.
 */
export enum TransitionStatusDataAttributes {
  /**
   * Present when the component begins animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the component is animating out.
   */
  endingStyle = 'data-ending-style',
}
