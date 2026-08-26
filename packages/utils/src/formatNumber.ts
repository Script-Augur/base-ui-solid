import { stringifyLocale } from './stringifyLocale'

const cache = new Map<string, Intl.NumberFormat>()

/**
 * Returns a cached `Intl.NumberFormat` for the given locale and options.
 *
 * @param locale - Locale passed to `Intl.NumberFormat`.
 * @param options - Formatting options.
 * @returns A number formatter instance.
 */
export function getFormatter(
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const optionsString = JSON.stringify({
    locale: stringifyLocale(locale),
    options,
  })
  const cachedFormatter = cache.get(optionsString)

  if (cachedFormatter) {
    return cachedFormatter
  }

  const formatter = new Intl.NumberFormat(locale, options)
  cache.set(optionsString, formatter)

  return formatter
}

/**
 * Formats a numeric value with `Intl.NumberFormat`.
 *
 * @param value - Number to format; `null` yields an empty string.
 * @param locale - Optional locale for formatting.
 * @param options - Optional `Intl.NumberFormat` options.
 * @returns The formatted string.
 */
export function formatNumber(
  value: number | null,
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions
): string {
  if (value == null) {
    return ''
  }
  return getFormatter(locale, options).format(value)
}
