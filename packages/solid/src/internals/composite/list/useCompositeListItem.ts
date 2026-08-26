import { createEffect, createSignal, onCleanup } from 'solid-js'

import { readMaybeAccessor } from '../../readMaybeAccessor'

import { useCompositeListContext } from './CompositeListContext'

import type { CompositeListRegistration } from './CompositeListContext'
import type { MaybeAccessor } from '../../readMaybeAccessor'
import type { Accessor } from 'solid-js'

/**
 * Registers a list item with {@link CompositeList} and tracks its DOM index.
 *
 * @typeParam TMetadata - Optional metadata published into the composite map.
 * @param params - Registration options (`metadata`, optional explicit `index`).
 * @returns `refAssign` to attach to the item node and an `index` accessor.
 */
export function useCompositeListItem<TMetadata>(
  params: UseCompositeListItemParameters<TMetadata> = {}
): UseCompositeListItemReturnValue {
  const context = useCompositeListContext<TMetadata>()
  const [index, indexAssign] = createSignal(params.index ?? -1)
  let nodeRef: HTMLElement | null = null

  /**
   * Resolves this item's metadata (plain value or accessor).
   *
   * @returns Metadata, or `null` when none is set.
   */
  function getMetadata(): TMetadata | null {
    return readMaybeAccessor<TMetadata | null>(params.metadata, null)
  }

  /**
   * Registers `node` with the list (and unregisters the previous node).
   *
   * @param node - Item element, or `null` to unregister.
   */
  function publish(node: HTMLElement | null) {
    if (nodeRef && nodeRef !== node) {
      context.unregister(nodeRef)
    }
    nodeRef = node
    if (node) {
      const registration: CompositeListRegistration<TMetadata> = {
        metadata: getMetadata(),
        index: params.index ?? null,
      }
      context.register(node, registration)
    }
  }

  /**
   * Re-registers the current node when metadata changes.
   */
  createEffect(function republishOnMetadataChange() {
    getMetadata()
    if (nodeRef) {
      context.register(nodeRef, {
        metadata: getMetadata(),
        index: params.index ?? null,
      })
    }
  })

  /**
   * Subscribes to list-map updates so `index` tracks this node's slot.
   */
  createEffect(function subscribeIndexFromMap() {
    /**
     * Applies this node's published index from the metadata map.
     *
     * @param map - Connected elements keyed to metadata (includes `index`).
     */
    return context.subscribeMapChange(function handleMapChange(map) {
      if (!nodeRef) return
      const entry = map.get(nodeRef)
      if (entry != null) {
        indexAssign(entry.index)
      }
    })
  })

  /**
   * Unregisters the item element when the owner scope disposes.
   */
  onCleanup(function unregisterOnCleanup() {
    if (nodeRef) context.unregister(nodeRef)
  })

  return {
    refAssign: publish,
    index,
  }
}
/**
 * Parameters for {@link useCompositeListItem}.
 *
 * @typeParam TMetadata - Optional metadata published into the composite map.
 */
export interface UseCompositeListItemParameters<TMetadata> {
  /** Value (or accessor) stored on this item in the composite metadata map. */
  metadata?: MaybeAccessor<TMetadata>
  /** Explicit list index; omit to assign by document order. */
  index?: number
}
/**
 * Return value of {@link useCompositeListItem}.
 */
export interface UseCompositeListItemReturnValue {
  /** Ref callback that registers or unregisters the item element.
   *
   * @param node - Item element, or `null` on unmount.
   */
  refAssign: (node: HTMLElement | null) => void
  /** Document-order index of this item in the list (`-1` until registered). */
  index: Accessor<number>
}
