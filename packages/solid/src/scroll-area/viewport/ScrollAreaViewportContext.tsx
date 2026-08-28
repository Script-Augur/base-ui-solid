import { createContext, useContext } from 'solid-js'

const ScrollAreaViewportContext = createContext<
  ScrollAreaViewportContextValue | undefined
>(undefined)
export { ScrollAreaViewportContext }
/**
 * Reads the nearest {@link ScrollAreaViewport} context.
 *
 * @returns Context value.
 * @throws If used outside a ScrollArea viewport.
 */
export function useScrollAreaViewportContext(): ScrollAreaViewportContextValue {
  const context = useContext(ScrollAreaViewportContext)
  if (context) return context

  throw new Error(
    'Base UI: ScrollAreaViewportContext missing. ScrollAreaViewport parts must be placed within <ScrollArea.Viewport>.'
  )
}
export interface ScrollAreaViewportContextValue {
  computeThumbPosition: () => void
}
