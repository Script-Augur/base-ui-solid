/**
 * Returns a value suitable for the HTML `inert` attribute across browsers.
 *
 * @param inert - Whether the element should be inert.
 * @returns `true` when inert, otherwise `undefined` so the attribute is omitted.
 *
 * @example
 * ```tsx
 * import { inertValue } from "@script-augur/base-ui-utils"
 *
 * <div inert={inertValue(locked())} />
 * ```
 */
export function inertValue(inert: boolean): boolean | undefined {
  return inert || undefined
}
