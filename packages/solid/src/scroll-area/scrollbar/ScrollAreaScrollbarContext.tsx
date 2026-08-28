import { createContext, useContext } from 'solid-js'

const ScrollAreaScrollbarContext = createContext<
  ScrollAreaScrollbarOrientation | undefined
>(undefined)
export { ScrollAreaScrollbarContext }
/**
 * Reads the nearest {@link ScrollAreaScrollbar} orientation.
 *
 * @returns `'horizontal'` | `'vertical'`.
 * @throws If used outside a ScrollArea scrollbar.
 */
export function useScrollAreaScrollbarContext(): ScrollAreaScrollbarOrientation {
  const context = useContext(ScrollAreaScrollbarContext)
  if (context) return context

  throw new Error(
    'Base UI: ScrollAreaScrollbarContext is missing. ScrollAreaScrollbar parts must be placed within <ScrollArea.Scrollbar>.'
  )
}
export type ScrollAreaScrollbarOrientation = 'horizontal' | 'vertical'
