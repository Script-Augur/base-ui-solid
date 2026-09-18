import { createContext, useContext } from 'solid-js'

import type { Align, Side } from './placement'
import type { Accessor } from 'solid-js'

/**
 * Positioning state published by {@link PreviewCardPositioner}.
 */
export const PreviewCardPositionerContext =
  createContext<PreviewCardPositionerContextValue>()

/**
 * Reads the nearest {@link PreviewCardPositioner} context.
 *
 * @returns Positioner context value.
 */
export function usePreviewCardPositionerContext(): PreviewCardPositionerContextValue {
  const context = useContext(PreviewCardPositionerContext)
  if (context == null) {
    throw new Error(
      'Base UI: PreviewCardPositioner parts must be used within <PreviewCard.Positioner>.'
    )
  }
  return context
}

/**
 * Context value from {@link PreviewCardPositioner}.
 */
export interface PreviewCardPositionerContextValue {
  side: Accessor<Side>
  align: Accessor<Align>
  arrowRef: (element: HTMLElement | null) => void
  arrowUncentered: Accessor<boolean>
  arrowStyles: Accessor<Record<string, string | undefined>>
}
