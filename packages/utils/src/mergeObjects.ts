/**
 * Shallow-merges objects left-to-right, skipping `null`/`undefined` sources and
 * keys whose value is `undefined`.
 *
 * @typeParam T - Result object shape.
 * @param objects - Partial objects to merge.
 * @returns A new object with the merged defined keys.
 *
 * @example
 * ```ts
 * import { mergeObjects } from "@script-augur/base-ui-utils"
 *
 * mergeObjects({ a: 1, b: 2 }, { b: undefined, c: 3 }, null)
 * // { a: 1, b: 2, c: 3 }
 * ```
 */
export function mergeObjects<T extends Record<string, unknown>>(
  ...objects: Array<Partial<T> | null | undefined>
): T {
  const result: Record<string, unknown> = {}
  for (const object of objects) {
    if (!object) continue
    for (const key of Object.keys(object)) {
      const value = object[key]
      if (value !== undefined) {
        result[key] = value
      }
    }
  }
  return result as T
}
