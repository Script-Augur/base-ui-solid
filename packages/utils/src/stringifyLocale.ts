/**
 * Stable string key for `Intl` locale arguments (used by formatter caches).
 *
 * @param locale - Locale or locale list passed to `Intl` APIs.
 * @returns A string suitable for cache keys.
 */
export function stringifyLocale(locale?: Intl.LocalesArgument): string {
  if (Array.isArray(locale)) {
    return locale.map(value => stringifyLocale(value)).join(',')
  }

  if (locale == null) {
    return ''
  }

  return String(locale)
}
