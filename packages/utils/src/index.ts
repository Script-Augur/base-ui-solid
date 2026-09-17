/**
 * Shared DOM and store helpers for `@script-augur/base-ui-solid`.
 * Framework-agnostic — keep Solid-specific APIs in the solid package.
 *
 * @example
 * ```ts
 * import { clamp, generateId, Timeout } from "@script-augur/base-ui-utils"
 *
 * clamp(120, 0, 100)
 * generateId("field")
 * ```
 */
export { clamp } from './clamp'
export { formatNumber, getFormatter } from './formatNumber'
export { stringifyLocale } from './stringifyLocale'
export { valueToPercent } from './valueToPercent'
export { generateId } from './generateId'
export { ownerDocument, ownerWindow } from './owner'
export { contains, getTarget, activeElement } from './shadowDom'
export { Timeout } from './timeout'
export { Interval } from './interval'
export { AnimationFrame } from './animationFrame'
export { inertValue } from './inertValue'
export { isElementDisabled } from './isElementDisabled'
export { mergeObjects } from './mergeObjects'
export { mergeCleanups } from './mergeCleanups'
export { addEventListener } from './addEventListener'
export { dispatchClickWithModifiers } from './dispatchClickWithModifiers'
export { visuallyHidden, visuallyHiddenInput } from './visuallyHidden'
export { getDefaultFormSubmitter } from './getDefaultFormSubmitter'
export { createStore } from './store'
export {
  SCROLL_EDGE_TOLERANCE_PX,
  getMaxScrollOffset,
  normalizeScrollOffset,
} from './scrollEdges'
export { platform, isWebkitEngine } from './platform'
export type { DefaultFormSubmitter } from './getDefaultFormSubmitter'
export type { Store, Listener } from './store'
