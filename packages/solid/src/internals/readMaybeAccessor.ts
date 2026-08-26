import type { Accessor } from 'solid-js'

/**
 * Resolves a plain value or Solid accessor, using `fallback` when omitted.
 *
 * Distinguishes accessors from values with `typeof === 'function'`. Do not use
 * optional-call (`value?.()`): booleans and numbers are valid `T` and are not
 * callable.
 *
 * @typeParam T - Resolved value type.
 * @param value - Value, accessor, or `undefined`.
 * @param fallback - Used when `value` is `undefined`.
 * @returns The current value.
 */
export function readMaybeAccessor<T>(
  value: MaybeAccessor<T> | undefined,
  fallback: T
): T {
  if (value === undefined) return fallback
  return typeof value === 'function' ? (value as Accessor<T>)() : value
}

/**
 * A plain value or a Solid accessor that yields that value.
 *
 * @typeParam T - Resolved value type.
 */
export type MaybeAccessor<T> = T | Accessor<T>
