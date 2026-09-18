import { serializeValue } from '../../internals/serializeValue'

import type { JSX } from 'solid-js'
/**
 * Serializes a Combobox value for form submission / autofill matching.
 *
 * Matches upstream `stringifyAsValue`: prefers a custom `itemToStringValue`,
 * then a `{ value }` shape, then {@link serializeValue}.
 *
 * @param value - Value to serialize.
 * @param itemToStringValue - Optional custom serializer.
 */
export function stringifyAsValue<TValue>(
  value: TValue | null | undefined,
  itemToStringValue?: (item: TValue) => string
): string {
  if (value == null) return ''
  if (itemToStringValue) return itemToStringValue(value)
  if (typeof value === 'object' && 'value' in (value as object)) {
    return serializeValue((value as unknown as { value: unknown }).value)
  }
  return serializeValue(value)
}
/**
 * Resolves the display label for a selected value from `items`, a custom
 * `itemToStringLabel`, a `{ label }` shape, or a stringified fallback.
 *
 * @param value - Currently selected value.
 * @param items - Optional label lookup for the combobox.
 * @param itemToStringLabel - Optional custom label formatter.
 */
export function resolveSelectedLabel<TValue>(
  value: TValue | null | undefined,
  items: ComboboxItems<TValue> | undefined,
  itemToStringLabel?: (item: TValue) => string
): JSX.Element | null {
  if (value == null) return null

  if (itemToStringLabel) return itemToStringLabel(value)

  if (items) {
    const found = findItemInItems(items, value)
    if (found !== undefined) return found
  }

  if (typeof value === 'object' && 'label' in (value as object)) {
    return (value as unknown as { label: JSX.Element }).label
  }

  return stringifyAsValue(value)
}
/**
 * Resolves display labels for a multiple-combobox value array, joined with
 * `, ` for a readable trigger summary.
 *
 * @param values - Currently selected values.
 * @param items - Optional label lookup for the combobox.
 * @param itemToStringLabel - Optional custom label formatter.
 */
export function resolveMultipleLabels<TValue>(
  values: ReadonlyArray<TValue>,
  items: ComboboxItems<TValue> | undefined,
  itemToStringLabel?: (item: TValue) => string
): string {
  return values
    .map(value => {
      const label = resolveSelectedLabel(value, items, itemToStringLabel)
      return typeof label === 'string' ? label : stringifyAsValue(value)
    })
    .join(', ')
}
/**
 * Whether a `null` item value has an explicit label in `items` (used to
 * distinguish "no selection" from "selected the null item").
 *
 * @param items - Optional label lookup for the combobox.
 */
export function hasNullItemLabel<TValue>(
  items: ComboboxItems<TValue> | undefined
): boolean {
  if (!items) return false
  if (Array.isArray(items)) {
    if (isGroupList(items)) {
      return items.some(group =>
        group.items.some(
          (item: { label: JSX.Element; value: TValue }) => item.value == null
        )
      )
    }
    return (items as ReadonlyArray<{ label: JSX.Element; value: TValue }>).some(
      item => item.value == null
    )
  }
  return '' in items
}
/**
 * A labeled group of items, matching upstream `items` group entries.
 *
 * @typeParam TValue - Item value type.
 */
export interface ComboboxItemGroup<TValue> {
  label: JSX.Element
  items: ReadonlyArray<{ label: JSX.Element; value: TValue }>
}
/**
 * Accepted shapes for `Combobox.Root`'s `items` prop: a plain label lookup, a
 * flat `{ label, value }` list, or a list of {@link ComboboxItemGroup}s.
 *
 * @typeParam TValue - Item value type.
 */
export type ComboboxItems<TValue> =
  | Record<string, JSX.Element>
  | ReadonlyArray<{ label: JSX.Element; value: TValue }>
  | ReadonlyArray<ComboboxItemGroup<TValue>>
function isGroupList<TValue>(
  items: ComboboxItems<TValue>
): items is ReadonlyArray<ComboboxItemGroup<TValue>> {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    typeof items[0] === 'object' &&
    items[0] !== null &&
    'items' in (items[0] as Record<string, unknown>)
  )
}
function findItemInItems<TValue>(
  items: ComboboxItems<TValue>,
  value: TValue
): JSX.Element | undefined {
  if (Array.isArray(items)) {
    if (isGroupList(items)) {
      for (const group of items) {
        for (const item of group.items) {
          if (Object.is(item.value, value)) return item.label
        }
      }
      return undefined
    }
    for (const item of items as ReadonlyArray<{
      label: JSX.Element
      value: TValue
    }>) {
      if (Object.is(item.value, value)) return item.label
    }
    return undefined
  }

  const record = items as Record<string, JSX.Element>
  const key = stringifyAsValue(value)
  return key in record ? record[key] : undefined
}
