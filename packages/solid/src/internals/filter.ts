import { serializeValue } from './serializeValue'

const filterCache = new Map<string, Filter>()
/**
 * Serializes an item for filter matching / display labels.
 *
 * Matches upstream `stringifyAsLabel`.
 *
 * @param item - Item to stringify.
 * @param itemToStringLabel - Optional custom label formatter.
 */
export function stringifyAsLabel<TItem>(
  item: TItem,
  itemToStringLabel?: (item: TItem) => string
): string {
  if (itemToStringLabel && item != null) {
    return itemToStringLabel(item)
  }
  if (item && typeof item === 'object') {
    if ('label' in item && (item as { label: unknown }).label != null) {
      return String((item as { label: unknown }).label)
    }
    if ('value' in item) {
      return String((item as { value: unknown }).value)
    }
  }
  return serializeValue(item)
}
/**
 * Returns a collator-backed filter with `contains` / `startsWith` / `endsWith`.
 *
 * Port of upstream `@base-ui/react` `getFilter` (no React hooks).
 *
 * @param options - Collator options plus optional `locale`.
 */
export function getFilter(options: GetFilterParameters = {}): Filter {
  const mergedOptions: Intl.CollatorOptions = {
    usage: 'search',
    sensitivity: 'base',
    ignorePunctuation: true,
    ...options,
  }
  const cacheKey = `${stringifyLocale(options.locale)}|${JSON.stringify(mergedOptions)}`
  const cachedFilter = filterCache.get(cacheKey)
  if (cachedFilter) {
    return cachedFilter
  }

  const collator = new Intl.Collator(options.locale, mergedOptions)
  const filter: Filter = {
    contains(item, query, itemToString) {
      if (!query) {
        return true
      }
      const itemString = stringifyAsLabel(item, itemToString)
      for (let i = 0; i <= itemString.length - query.length; i += 1) {
        if (
          collator.compare(itemString.slice(i, i + query.length), query) === 0
        ) {
          return true
        }
      }
      return false
    },
    startsWith(item, query, itemToString) {
      if (!query) {
        return true
      }
      const itemString = stringifyAsLabel(item, itemToString)
      return collator.compare(itemString.slice(0, query.length), query) === 0
    },
    endsWith(item, query, itemToString) {
      if (!query) {
        return true
      }
      const itemString = stringifyAsLabel(item, itemToString)
      const queryLength = query.length
      return (
        itemString.length >= queryLength &&
        collator.compare(
          itemString.slice(itemString.length - queryLength),
          query
        ) === 0
      )
    },
  }
  filterCache.set(cacheKey, filter)
  return filter
}
/** Options for {@link getFilter}. */
export interface GetFilterParameters extends Intl.CollatorOptions {
  /**
   * The locale to use for string comparison.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined
}
/** Collator filter returned by {@link getFilter}. */
export interface Filter {
  /** Returns whether the item matches the query anywhere. */
  contains: <TItem>(
    item: TItem,
    query: string,
    itemToString?: (item: TItem) => string
  ) => boolean
  /** Returns whether the item starts with the query. */
  startsWith: <TItem>(
    item: TItem,
    query: string,
    itemToString?: (item: TItem) => string
  ) => boolean
  /** Returns whether the item ends with the query. */
  endsWith: <TItem>(
    item: TItem,
    query: string,
    itemToString?: (item: TItem) => string
  ) => boolean
}
/**
 * Converts an `Intl.LocalesArgument` into a stable string for cache keys.
 *
 * @param locale - Locale argument passed to `Intl.Collator`.
 */
function stringifyLocale(locale: Intl.LocalesArgument | undefined): string {
  if (locale == null) return ''
  if (typeof locale === 'string') return locale
  if (Array.isArray(locale)) return locale.map(String).join(',')
  try {
    return JSON.stringify(locale)
  } catch {
    return String(locale)
  }
}
