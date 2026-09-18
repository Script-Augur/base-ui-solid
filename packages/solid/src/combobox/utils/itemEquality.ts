/**
 * Default item-equality comparison for Combobox values.
 *
 * Matches upstream `defaultItemEquality`: identity (`Object.is`) first, then a
 * shallow `{ value }` shape comparison so `{ value, label }` item objects
 * compare by their `value` field without a custom `isItemEqualToValue`.
 *
 * @param itemValue - Value declared on a `Combobox.Item`.
 * @param value - Currently selected value (or candidate) to compare against.
 * @returns `true` when the two values should be treated as equal.
 */
export function defaultItemEquality(
  itemValue: unknown,
  value: unknown
): boolean {
  if (Object.is(itemValue, value)) return true

  if (
    itemValue != null &&
    value != null &&
    typeof itemValue === 'object' &&
    typeof value === 'object' &&
    'value' in itemValue &&
    'value' in value
  ) {
    return Object.is(itemValue.value, value.value)
  }

  return false
}

/**
 * Compares `itemValue` against `value` using a caller-supplied comparator,
 * falling back to {@link defaultItemEquality}.
 *
 * @param itemValue - Value declared on a `Combobox.Item`.
 * @param value - Currently selected value (or candidate) to compare against.
 * @param comparer - Optional custom `isItemEqualToValue`.
 */
export function compareItemEquality(
  itemValue: unknown,
  value: unknown,
  comparer?: (itemValue: unknown, value: unknown) => boolean
): boolean {
  return comparer
    ? comparer(itemValue, value)
    : defaultItemEquality(itemValue, value)
}

/**
 * Removes the first item matching `value` from `list` (multiple-combobox
 * toggle-off), comparing with {@link compareItemEquality}.
 *
 * @param list - Current multiple-combobox value array.
 * @param value - Value to remove.
 * @param comparer - Optional custom `isItemEqualToValue`.
 */
export function removeItem<TValue>(
  list: ReadonlyArray<TValue>,
  value: TValue,
  comparer?: (itemValue: unknown, value: unknown) => boolean
): Array<TValue> {
  const index = list.findIndex(candidate =>
    compareItemEquality(candidate, value, comparer)
  )
  if (index === -1) return [...list]
  const next = [...list]
  next.splice(index, 1)
  return next
}
