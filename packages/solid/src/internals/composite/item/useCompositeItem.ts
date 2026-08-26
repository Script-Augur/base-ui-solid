import { createMemo } from 'solid-js'

import { useCompositeListItem } from '../list/useCompositeListItem'
import { useCompositeRootContext } from '../root/CompositeRootContext'

import type { MaybeAccessor } from '../../readMaybeAccessor'
import type { Accessor } from 'solid-js'

/**
 * Roving tabindex item wiring for composite lists.
 *
 * Registers the item with {@link useCompositeListItem}, then exposes
 * `tabIndex` / focus handlers so keyboard highlight stays in sync with
 * {@link useCompositeRootContext}.
 *
 * @typeParam TMetadata - Optional metadata published into the composite map.
 * @param params - Item registration options (`metadata` accessor or value).
 * @returns `compositeProps`, `compositeRef`, and the item `index` accessor.
 */
export function useCompositeItem<TMetadata>(
  params: UseCompositeItemParameters<TMetadata> = {}
): UseCompositeItemReturnValue {
  const root = useCompositeRootContext()
  const { refAssign, index } = useCompositeListItem(params)

  let itemEl: HTMLElement | null = null

  /**
   * Stores the item element and registers it with {@link useCompositeListItem}.
   *
   * @param node - Item element, or `null` on unmount.
   */
  function compositeRef(node: HTMLElement | null) {
    itemEl = node
    refAssign(node)
  }

  const compositeProps = createMemo(() => {
    const highlighted = root.highlightedIndex() === index()
    return {
      tabIndex: highlighted ? 0 : -1,
      onFocus() {
        root.onHighlightedIndexChange(index())
      },
      onMouseMove() {
        if (!root.highlightItemOnHover() || !itemEl) return
        const disabled =
          itemEl.hasAttribute('disabled') ||
          itemEl.getAttribute('aria-disabled') === 'true'
        if (!highlighted && !disabled) {
          itemEl.focus()
        }
      },
    }
  })

  return {
    compositeProps,
    compositeRef,
    index,
  }
}

/**
 * Parameters for {@link useCompositeItem}.
 *
 * @typeParam TMetadata - Optional metadata published into the composite map.
 */
export interface UseCompositeItemParameters<TMetadata> {
  /** Value (or accessor) stored on this item in the composite metadata map. */
  metadata?: MaybeAccessor<TMetadata>
}

/**
 * Return value of {@link useCompositeItem}.
 */
export interface UseCompositeItemReturnValue {
  /** Props to merge onto the item: `tabIndex`, `onFocus`, `onMouseMove`. */
  compositeProps: () => Record<string, unknown>
  /** Ref callback that registers the item element with the composite list.
   *
   * @param node - Item element, or `null` on unmount.
   */
  compositeRef: (node: HTMLElement | null) => void
  /** Document-order index of this item in the list (`-1` until registered). */
  index: Accessor<number>
}
