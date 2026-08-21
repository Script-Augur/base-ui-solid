let globalId = 0

/**
 * Generates a process-unique id string for accessibility wiring.
 *
 * Prefer letting consumers pass explicit ids when possible; this is a fallback
 * for unlabeled parts that still need stable `id` / `aria-*` pairing within a
 * session.
 *
 * @param prefix - Prefix prepended to the numeric counter. Defaults to `"base-ui"`.
 * @returns An id like `"base-ui-1"`.
 *
 * @example
 * ```ts
 * import { generateId } from "@script-augur/base-ui-utils"
 *
 * const labelId = generateId("checkbox-label")
 * // "checkbox-label-1"
 * ```
 */
export function generateId(prefix = 'base-ui'): string {
  globalId += 1
  return `${prefix}-${globalId}`
}
