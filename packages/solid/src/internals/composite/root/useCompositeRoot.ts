import { readMaybeAccessor } from '../../readMaybeAccessor'
import {
  ACTIVE_COMPOSITE_ITEM,
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  COMPOSITE_KEYS,
  END,
  HOME,
  findNonDisabledListIndex,
  getMaxListIndex,
  getMinListIndex,
  isIndexOutOfListBounds,
  isListIndexDisabled,
} from '../composite'

import type { Accessor } from 'solid-js'

/**
 * Keyboard highlight and default-index logic for a composite list.
 *
 * Tracks the highlighted index (controlled or internal), seeds it from the
 * first map publish, and moves it with arrow / Home / End keys.
 *
 * @param params - Orientation, loop, highlight, and element-list configuration.
 * @returns Highlight accessors and `onMapChange` / `onKeyDown` handlers.
 */
export function useCompositeRoot(
  params: UseCompositeRootParameters
): UseCompositeRootReturnValue {
  let internalHighlightedIndex = 0
  let hasSetDefaultIndex = false

  return {
    highlightedIndex: getHighlightedIndex,
    onHighlightedIndexChange,
    onMapChange,
    onKeyDown,
  }

  /**
   * Reads the current highlighted index: controlled value when defined,
   * otherwise the internal index.
   *
   * @returns The highlighted list index.
   */
  function getHighlightedIndex(): number {
    const external = params.highlightedIndex?.()
    return external !== undefined ? external : internalHighlightedIndex
  }

  /**
   * Updates the internal highlighted index and notifies
   * `params.onHighlightedIndexChange`.
   *
   * @param index - Newly highlighted list index.
   */
  function onHighlightedIndexChange(index: number): void {
    internalHighlightedIndex = index
    params.onHighlightedIndexChange?.(index)
  }

  /**
   * On the first non-empty map, selects the item marked
   * {@link ACTIVE_COMPOSITE_ITEM}, or the first enabled item when the current
   * highlight is disabled.
   *
   * @param map - Composite elements keyed to `{ index }`.
   */
  function onMapChange(map: Map<Element, { index: number }>): void {
    if (map.size === 0 || hasSetDefaultIndex) {
      return
    }
    hasSetDefaultIndex = true

    const sortedElements = Array.from(map.keys()) as Array<HTMLElement>
    const activeItem =
      sortedElements.find(el => el.hasAttribute(ACTIVE_COMPOSITE_ITEM)) ?? null
    const activeIndex = activeItem ? (map.get(activeItem)?.index ?? -1) : -1
    const disabledIndices = params.disabledIndices?.()
    const elements = params.elementsRef.current

    if (activeIndex !== -1) {
      onHighlightedIndexChange(activeIndex)
    } else if (
      isListIndexDisabled(elements, getHighlightedIndex(), disabledIndices)
    ) {
      const firstEnabled = findNonDisabledListIndex(elements, {
        disabledIndices,
      })
      if (!isIndexOutOfListBounds(elements, firstEnabled)) {
        onHighlightedIndexChange(firstEnabled)
      }
    }
  }

  /**
   * Moves highlight with arrow keys (and Home/End when enabled). Ignores
   * unmodified-key mismatches, modifier chords, and disabled indexes.
   *
   * @param event - Native keyboard event from the composite root.
   */
  function onKeyDown(event: KeyboardEvent): void {
    const enableHomeAndEnd = readMaybeAccessor(
      params.enableHomeAndEndKeys,
      false
    )
    const isHomeOrEnd = event.key === HOME || event.key === END
    if (!COMPOSITE_KEYS.has(event.key) || (!enableHomeAndEnd && isHomeOrEnd)) {
      return
    }

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return
    }

    const orientation = readMaybeAccessor(params.orientation, 'both')
    const isRtl = readMaybeAccessor(params.direction, 'ltr') === 'rtl'
    const loopFocus = readMaybeAccessor(params.loopFocus, true)
    const disabledIndices = params.disabledIndices?.()
    const elements = params.elementsRef.current
    const highlightedIndex = getHighlightedIndex()

    const horizontalForwardKey = isRtl ? ARROW_LEFT : ARROW_RIGHT
    const horizontalBackwardKey = isRtl ? ARROW_RIGHT : ARROW_LEFT

    let nextIndex = highlightedIndex
    const minIndex = getMinListIndex(elements, disabledIndices)
    const maxIndex = getMaxListIndex(elements, disabledIndices)

    if (enableHomeAndEnd) {
      if (event.key === HOME) {
        nextIndex = minIndex
      } else if (event.key === END) {
        nextIndex = maxIndex
      }
    }

    const isForwardKey =
      (orientation !== 'vertical' && event.key === horizontalForwardKey) ||
      (orientation !== 'horizontal' && event.key === ARROW_DOWN)
    const isBackwardKey =
      (orientation !== 'vertical' && event.key === horizontalBackwardKey) ||
      (orientation !== 'horizontal' && event.key === ARROW_UP)

    if (nextIndex === highlightedIndex && (isForwardKey || isBackwardKey)) {
      if (loopFocus && nextIndex === maxIndex && isForwardKey) {
        nextIndex = minIndex
      } else if (loopFocus && nextIndex === minIndex && isBackwardKey) {
        nextIndex = maxIndex
      } else {
        nextIndex = findNonDisabledListIndex(elements, {
          startingIndex: nextIndex,
          decrement: isBackwardKey,
          disabledIndices,
        })
      }
    }

    if (
      nextIndex !== highlightedIndex &&
      !isIndexOutOfListBounds(elements, nextIndex)
    ) {
      if (readMaybeAccessor(params.stopEventPropagation, true)) {
        event.stopPropagation()
      }
      event.preventDefault()
      onHighlightedIndexChange(nextIndex)
      elements[nextIndex]?.focus()
    }
  }
}

/**
 * Parameters for {@link useCompositeRoot}.
 */
export interface UseCompositeRootParameters {
  /**
   * Arrow-key axes to handle.
   *
   * @default 'both'
   */
  orientation?: Accessor<'horizontal' | 'vertical' | 'both'>
  /**
   * When `true`, arrow keys wrap from the last item to the first (and vice versa).
   *
   * @default true
   */
  loopFocus?: Accessor<boolean>
  /** Controlled highlighted index. Omit (or return `undefined`) for internal state. */
  highlightedIndex?: Accessor<number | undefined>
  /**
   * Called when the highlighted index changes.
   *
   * @param index - Newly highlighted list index.
   */
  onHighlightedIndexChange?: (index: number) => void
  /**
   * When `true`, Home/End move highlight to the first/last enabled item.
   *
   * @default false
   */
  enableHomeAndEndKeys?: Accessor<boolean>
  /**
   * When `true`, handled composite keys call `stopPropagation`.
   *
   * @default true
   */
  stopEventPropagation?: Accessor<boolean>
  /** List indexes skipped by keyboard navigation. */
  disabledIndices?: Accessor<Array<number> | null | undefined>
  /** Text direction used to flip left/right arrow keys. @default 'ltr' */
  direction?: Accessor<'ltr' | 'rtl'>
  /** Mutable array of item elements in list index order. */
  elementsRef: { current: Array<HTMLElement | null> }
}

/**
 * Return value of {@link useCompositeRoot}.
 */
export interface UseCompositeRootReturnValue {
  /** Current highlighted list index (controlled or internal). */
  highlightedIndex: Accessor<number>
  /**
   * Sets the highlighted index and forwards to `onHighlightedIndexChange`.
   *
   * @param index - Newly highlighted list index.
   */
  onHighlightedIndexChange: (index: number) => void
  /**
   * Seeds the default highlight from the first non-empty composite map.
   *
   * @param map - Composite elements keyed to `{ index }`.
   */
  onMapChange: (map: Map<Element, { index: number }>) => void
  /**
   * Keyboard handler for arrow / Home / End navigation.
   *
   * @param event - Native keyboard event from the composite root.
   */
  onKeyDown: (event: KeyboardEvent) => void
}
