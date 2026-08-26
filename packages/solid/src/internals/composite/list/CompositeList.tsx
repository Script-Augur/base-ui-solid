import { createEffect, onCleanup } from 'solid-js'

import { CompositeListContext } from './CompositeListContext'

import type {
  CompositeListContextValue,
  CompositeListRegistration,
  CompositeMetadata,
} from './CompositeListContext'
import type { JSX } from 'solid-js'

/**
 * Tracks composite list items by document order and publishes a metadata map.
 *
 * Children call {@link useCompositeListItem} to register. Indexes are assigned
 * from the DOM unless a registration supplies an explicit index. Subscribers
 * (and `onMapChange`) receive a map of connected elements to
 * {@link CompositeMetadata}.
 *
 * @typeParam TMetadata - Per-item metadata merged into the published map.
 * @param props - List children, optional `elementsRef`, and `onMapChange`.
 * @returns A context provider wrapping `props.children`.
 */
export function CompositeList<TMetadata>(
  props: CompositeListProps<TMetadata>
): JSX.Element {
  let lastMap = new Map<Element, CompositeMetadata<TMetadata>>()
  const listeners = new Set<
    (map: Map<Element, CompositeMetadata<TMetadata>>) => void
  >()
  const map = new Map<Element, CompositeListRegistration<TMetadata>>()
  const elementsRef = props.elementsRef ?? {
    current: [] as Array<HTMLElement | null>,
  }
  let dirty = true

  /**
   * Rebuilds the ordered metadata map from connected registrations, writes
   * `elementsRef.current`, and notifies subscribers.
   */
  const syncAndPublish = () => {
    const items: Array<{
      element: HTMLElement
      registration: CompositeListRegistration<TMetadata>
      index: number
    }> = []

    map.forEach((registration, node) => {
      if (!node.isConnected) return
      items.push({
        element: node as HTMLElement,
        registration,
        index: registration.index ?? -1,
      })
    })

    const automatic = items.filter(item => item.registration.index == null)
    const reserved = items.filter(
      item => item.registration.index != null && item.registration.index >= 0
    )

    automatic.sort((a, b) => {
      const position = a.element.compareDocumentPosition(b.element)
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })

    const reservedIndices = new Set(
      reserved.map(item => item.registration.index!)
    )
    let nextAutomatic = 0
    for (const item of automatic) {
      while (reservedIndices.has(nextAutomatic)) nextAutomatic += 1
      item.index = nextAutomatic
      nextAutomatic += 1
    }

    const ordered = [...reserved, ...automatic].sort(
      (a, b) => a.index - b.index
    )

    elementsRef.current.length = 0
    const nextMap = new Map<Element, CompositeMetadata<TMetadata>>()
    for (const item of ordered) {
      nextMap.set(item.element, {
        ...(item.registration.metadata ?? ({} as TMetadata)),
        index: item.index,
      })
      elementsRef.current[item.index] = item.element
    }

    dirty = false
    lastMap = nextMap
    listeners.forEach(listener => listener(nextMap))
    props.onMapChange?.(nextMap)
  }

  /**
   * Adds or replaces a registration for `node` and republishes the map.
   *
   * @param node - Item element being registered.
   * @param registration - Metadata and optional explicit index for the item.
   */
  const register = (
    node: Element,
    registration: CompositeListRegistration<TMetadata>
  ) => {
    map.set(node, registration)
    dirty = true
    syncAndPublish()
  }

  /**
   * Removes `node` from the list and republishes the map.
   *
   * @param node - Item element being unregistered.
   */
  const unregister = (node: Element) => {
    map.delete(node)
    dirty = true
    syncAndPublish()
  }

  /**
   * Subscribes to map updates. The latest map is replayed immediately when it
   * is non-empty so late subscribers still receive indexes.
   *
   * @param fn - Called with the current element → metadata map.
   * @returns An unsubscribe function.
   */
  const subscribeMapChange = (
    fn: (next: Map<Element, CompositeMetadata<TMetadata>>) => void
  ) => {
    listeners.add(fn)
    if (lastMap.size > 0) fn(lastMap)
    /**
     * Removes `fn` from the subscriber set.
     */
    return () => {
      listeners.delete(fn)
    }
  }

  createEffect(() => {
    if (dirty) syncAndPublish()
    onCleanup(() => {
      elementsRef.current = []
    })
  })

  const contextValue: CompositeListContextValue<TMetadata> = {
    register,
    unregister,
    subscribeMapChange,
    elementsRef,
  }

  return (
    <CompositeListContext.Provider value={contextValue}>
      {props.children}
    </CompositeListContext.Provider>
  )
}

export type { CompositeMetadata }

/**
 * Props for {@link CompositeList}.
 *
 * @typeParam TMetadata - Per-item metadata merged into the published map.
 */
export interface CompositeListProps<TMetadata> {
  /** Composite items (and any wrapping markup) that register via context. */
  children: JSX.Element
  /**
   * Mutable array of item elements in list index order. Created internally
   * when omitted.
   */
  elementsRef?: { current: Array<HTMLElement | null> }
  /**
   * Called whenever the ordered metadata map is rebuilt (register, unregister,
   * or a dirty sync).
   *
   * @param map - Connected elements keyed to {@link CompositeMetadata}.
   */
  onMapChange?: (map: Map<Node, CompositeMetadata<TMetadata>>) => void
}
