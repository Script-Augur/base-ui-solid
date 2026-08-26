import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Context for {@link CompositeRoot}.
 */
const CompositeRootContext = createContext<CompositeRootContextValue>()
export { CompositeRootContext }

/**
 * Reads the nearest {@link CompositeRoot} context.
 *
 * @returns Context value.
 * @throws If used outside {@link CompositeRoot}.
 */
export function useCompositeRootContext(): CompositeRootContextValue {
  const context = useContext(CompositeRootContext)
  if (context === undefined) {
    throw new Error(
      'Base UI: CompositeRootContext is missing. Composite parts must be placed within <CompositeRoot>.'
    )
  }
  return context
}

/**
 * Value provided by {@link CompositeRoot} to composite items.
 */
export interface CompositeRootContextValue {
  /** Current highlighted list index. */
  highlightedIndex: Accessor<number>
  /**
   * Sets the highlighted index.
   *
   * @param index - Newly highlighted list index.
   */
  onHighlightedIndexChange: (index: number) => void
  /** Whether hovering an item should move highlight. */
  highlightItemOnHover: Accessor<boolean>
  /**
   * Keyboard handler for composite navigation.
   *
   * @param event - Native keyboard event from the composite root.
   */
  onKeyDown: (event: KeyboardEvent) => void
}
