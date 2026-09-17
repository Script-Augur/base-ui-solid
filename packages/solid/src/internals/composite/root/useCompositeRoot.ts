import { isElementDisabled } from '@script-augur/base-ui-utils'
import { createEffect, createSignal } from 'solid-js'

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
  MODIFIER_KEYS,
  findNonDisabledListIndex,
  getMaxListIndex,
  getMinListIndex,
  isIndexOutOfListBounds,
  isListIndexDisabled,
  isNativeInput,
} from '../composite'

import type { ModifierKey } from '../composite'
import type { Accessor } from 'solid-js'

const EMPTY_MODIFIER_KEYS: ReadonlyArray<ModifierKey> = []
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
  const [internalHighlightedIndex, internalHighlightedIndexAssign] =
    createSignal(0)
  let hasSetDefaultIndex = false

  // `disabledIndices` can resolve a render after the initial map population
  // (e.g. Toolbar derives it from item metadata through a signal update), so the
  // default tab stop at index 0 may now point at a disabled item. Re-validate
  // and move it to the first enabled item when `disabledIndices` is provided.
  createEffect(function revalidateDisabledDefaultIndex() {
    const disabledIndices = params.disabledIndices?.()
    if (
      disabledIndices == null ||
      params.highlightedIndex?.() !== undefined ||
      !hasSetDefaultIndex
    ) {
      return
    }
    const elements = params.elementsRef.current
    if (isListIndexDisabled(elements, getHighlightedIndex(), disabledIndices)) {
      const firstEnabledIndex = findNonDisabledListIndex(elements, {
        disabledIndices,
      })
      if (!isIndexOutOfListBounds(elements, firstEnabledIndex)) {
        onHighlightedIndexChange(firstEnabledIndex)
      }
    }
  })

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
    return external !== undefined ? external : internalHighlightedIndex()
  }

  /**
   * Updates the internal highlighted index and notifies
   * `params.onHighlightedIndexChange`.
   *
   * @param index - Newly highlighted list index.
   */
  function onHighlightedIndexChange(index: number): void {
    if (params.highlightedIndex?.() === undefined) {
      internalHighlightedIndexAssign(index)
    }
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

    const modifierKeys = params.modifierKeys?.() ?? EMPTY_MODIFIER_KEYS
    if (isModifierKeySet(event, modifierKeys)) {
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
    const forwardKey =
      orientation === 'vertical' ? ARROW_DOWN : horizontalForwardKey
    const backwardKey =
      orientation === 'vertical' ? ARROW_UP : horizontalBackwardKey

    const target = event.target
    if (
      target != null &&
      isNativeInput(target) &&
      !isElementDisabled(target)
    ) {
      const selectionStart = target.selectionStart
      const selectionEnd = target.selectionEnd
      const textContent = target.value
      // Return to native textbox behavior when:
      // 1 - Shift is held to make a text selection, or if there already is a text selection
      if (
        selectionStart == null ||
        event.shiftKey ||
        selectionStart !== selectionEnd
      ) {
        return
      }
      // 2 - arrowing forward and not in the last position of the text
      if (event.key !== backwardKey && selectionStart < textContent.length) {
        return
      }
      // 3 - arrowing backward and not in the first position of the text
      if (event.key !== forwardKey && selectionStart > 0) {
        return
      }
    }

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
  /**
   * Modifier keys that are allowed during navigation (e.g. Shift for
   * Radio Group). Any other active modifier blocks the key.
   */
  modifierKeys?: Accessor<ReadonlyArray<ModifierKey> | undefined>
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
/**
 * Whether a disallowed modifier is held for this keyboard event.
 *
 * @param event - Native keyboard event.
 * @param ignoredModifierKeys - Modifiers that are allowed (not blocking).
 * @returns `true` when navigation should be skipped.
 */
function isModifierKeySet(
  event: KeyboardEvent,
  ignoredModifierKeys: ReadonlyArray<ModifierKey>
): boolean {
  for (const key of MODIFIER_KEYS) {
    if (ignoredModifierKeys.includes(key)) {
      continue
    }
    if (event.getModifierState(key)) {
      return true
    }
  }
  return false
}
