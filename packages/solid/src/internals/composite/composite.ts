/** Attribute set on the active composite item so default highlight can follow it. */
export const ACTIVE_COMPOSITE_ITEM = 'data-composite-item-active'
/** `KeyboardEvent.key` for ArrowUp. */
export const ARROW_UP = 'ArrowUp'
/** `KeyboardEvent.key` for ArrowDown. */
export const ARROW_DOWN = 'ArrowDown'
/** `KeyboardEvent.key` for ArrowLeft. */
export const ARROW_LEFT = 'ArrowLeft'
/** `KeyboardEvent.key` for ArrowRight. */
export const ARROW_RIGHT = 'ArrowRight'
/** `KeyboardEvent.key` for Home. */
export const HOME = 'Home'
/** `KeyboardEvent.key` for End. */
export const END = 'End'
/** Keys handled by composite list navigation. */
export const COMPOSITE_KEYS = new Set([
  ARROW_UP,
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  HOME,
  END,
])

/**
 * Whether `list[index]` should be skipped during keyboard navigation.
 *
 * @param list - Item elements in list order (holes allowed).
 * @param index - Candidate index.
 * @param disabledIndices - Explicit disabled indexes; when omitted, native
 *   `disabled` on the element is used (`aria-disabled` does not skip).
 * @returns `true` if the index is disabled or has no element.
 */
export function isListIndexDisabled(
  list: Array<HTMLElement | null | undefined>,
  index: number,
  disabledIndices?: Array<number> | null
): boolean {
  if (disabledIndices) {
    return disabledIndices.includes(index)
  }
  const element = list[index]
  if (!element) return true

  return (
    'disabled' in element && Boolean((element as HTMLInputElement).disabled)
  )
}

/**
 * Walks `list` from `startingIndex` and returns the next enabled index.
 *
 * @param list - Item elements in list order (holes allowed).
 * @param options - Search direction, start, and disabled indexes.
 * @returns The next enabled index, or `-1` if none.
 */
export function findNonDisabledListIndex(
  list: Array<HTMLElement | null | undefined>,
  {
    startingIndex = -1,
    decrement = false,
    disabledIndices,
  }: FindNonDisabledListIndexOptions = {}
): number {
  const step = decrement ? -1 : 1
  let index = startingIndex + step

  while (index >= 0 && index < list.length) {
    if (!isListIndexDisabled(list, index, disabledIndices)) {
      return index
    }

    index += step
  }

  return -1
}

/**
 * First enabled index in `list`.
 *
 * @param list - Item elements in list order (holes allowed).
 * @param disabledIndices - Explicit disabled indexes.
 * @returns The minimum enabled index, or `-1` if none.
 */
export function getMinListIndex(
  list: Array<HTMLElement | null | undefined>,
  disabledIndices?: Array<number> | null
): number {
  return findNonDisabledListIndex(list, { startingIndex: -1, disabledIndices })
}

/**
 * Last enabled index in `list`.
 *
 * @param list - Item elements in list order (holes allowed).
 * @param disabledIndices - Explicit disabled indexes.
 * @returns The maximum enabled index, or `-1` if none.
 */
export function getMaxListIndex(
  list: Array<HTMLElement | null | undefined>,
  disabledIndices?: Array<number> | null
): number {
  return findNonDisabledListIndex(list, {
    startingIndex: list.length,
    decrement: true,
    disabledIndices,
  })
}
/**
 * Whether `index` is outside `[0, list.length)`.
 *
 * @param list - Item elements in list order (holes allowed).
 * @param index - Candidate index.
 * @returns `true` when the index is not a valid list slot.
 */
export function isIndexOutOfListBounds(
  list: Array<HTMLElement | null | undefined>,
  index: number
): boolean {
  return index < 0 || index >= list.length
}

/**
 * Options for {@link findNonDisabledListIndex}.
 */
export interface FindNonDisabledListIndexOptions {
  /** Index to step from (exclusive). @default -1 */
  startingIndex?: number
  /** When `true`, search toward the start of the list. @default false */
  decrement?: boolean
  /** Indexes to skip; when omitted, native `disabled` on the element is used. */
  disabledIndices?: Array<number> | null
}
