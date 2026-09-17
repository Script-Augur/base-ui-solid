/**
 * Serializes a value for a native `<input value="…">` attribute.
 *
 * Matches upstream `@base-ui/react` `serializeValue`.
 *
 * @param value - Value to serialize.
 * @returns A string suitable for the DOM `value` attribute.
 */
export function serializeValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
