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
export { AnimationFrame } from './animationFrame'
export { inertValue } from './inertValue'
export { isElementDisabled } from './isElementDisabled'
export { mergeObjects } from './mergeObjects'
export { dispatchClickWithModifiers } from './dispatchClickWithModifiers'
export { createStore } from './store'
export type { Store, Listener } from './store'
