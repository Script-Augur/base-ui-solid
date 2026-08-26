import { createContext, useContext } from 'solid-js'

/**
 * Context for {@link CompositeList}.
 */
const CompositeListContext = createContext<CompositeListContextValue<any>>()

export { CompositeListContext }

/**
 * Reads the nearest {@link CompositeList} context.
 *
 * @typeParam TMetadata - Metadata type published by the enclosing list.
 * @returns Register / unsubscribe APIs and `elementsRef` for that list.
 * @throws If used outside {@link CompositeList}.
 */
export function useCompositeListContext<
  TMetadata = unknown,
>(): CompositeListContextValue<TMetadata> {
  const context = useContext(CompositeListContext)
  if (!context) {
    throw new Error(
      'Base UI: CompositeListContext is missing. Composite parts must be placed within <CompositeList>.'
    )
  }
  return context as CompositeListContextValue<TMetadata>
}

/**
 * Data an item passes to {@link CompositeListContextValue.register}.
 *
 * @typeParam TMetadata - Caller-owned metadata stored on the item.
 */
export interface CompositeListRegistration<TMetadata> {
  /** Item metadata, or `null` when the item has none. */
  metadata: TMetadata | null
  /**
   * Explicit list index. `null` means {@link CompositeList} assigns an index
   * from document order.
   */
  index: number | null
}

/**
 * Published map value: caller metadata plus the resolved list `index`.
 *
 * @typeParam TMetadata - Caller-owned metadata stored on the item.
 */
export type CompositeMetadata<TMetadata> = {
  /** Resolved index in the composite list. */
  index: number
} & TMetadata

/**
 * Value provided by {@link CompositeList} to registered items.
 *
 * @typeParam TMetadata - Caller-owned metadata stored on each item.
 */
export interface CompositeListContextValue<TMetadata = unknown> {
  /**
   * Adds or replaces a registration for `node` and republishes the metadata map.
   *
   * @param node - Item element being registered.
   * @param registration - Metadata and optional explicit index.
   */
  register: (
    node: Element,
    registration: CompositeListRegistration<TMetadata>
  ) => void
  /**
   * Removes `node` from the list and republishes the metadata map.
   *
   * @param node - Item element being unregistered.
   */
  unregister: (node: Element) => void
  /**
   * Subscribes to metadata-map updates. The latest map is replayed when it is
   * already non-empty.
   *
   * @param fn - Called with the current element → {@link CompositeMetadata} map.
   * @returns Unsubscribe function.
   */
  subscribeMapChange: (
    fn: (map: Map<Element, CompositeMetadata<TMetadata>>) => void
  ) => () => void
  /** Item elements in list-index order (holes allowed). */
  elementsRef: { current: Array<HTMLElement | null> }
}
