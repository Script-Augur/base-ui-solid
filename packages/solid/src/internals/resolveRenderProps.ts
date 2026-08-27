/**
 * Resolves a static or state-derived class string.
 *
 * @typeParam TState - Component state passed to class functions.
 * @param className - Static class or `(state) => class`.
 * @param state - Current component state.
 * @returns Resolved class string, if any.
 */
export function resolveClassName<TState>(
  className: string | ((state: TState) => string | undefined) | undefined,
  state: TState
): string | undefined {
  return typeof className === 'function' ? className(state) : className
}

/**
 * Resolves a static or state-derived style object.
 *
 * @typeParam TState - Component state passed to style functions.
 * @param style - Static style or `(state) => style`.
 * @param state - Current component state.
 * @returns Resolved style object, if any.
 */
export function resolveStyle<TState>(
  style:
    | Record<string, string | number>
    | ((state: TState) => Record<string, string | number> | undefined)
    | undefined,
  state: TState
): Record<string, string | number> | undefined {
  return typeof style === 'function' ? style(state) : style
}

/**
 * Concatenates class strings (rightmost first, matching Base UI merge order).
 *
 * @param ourClass - Existing class string.
 * @param theirClass - Class string to prepend.
 * @returns Merged class string.
 */
export function mergeClassNames(
  ourClass: string | undefined,
  theirClass: string | undefined
): string | undefined {
  if (theirClass) {
    if (ourClass) {
      return `${theirClass} ${ourClass}`
    }
    return theirClass
  }
  return ourClass
}
