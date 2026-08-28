import { createContext, useContext } from 'solid-js'

import type {
  Coords,
  HiddenState,
  OverflowEdges,
  ScrollAreaRootState,
  Size,
} from './ScrollAreaRoot'
import type { Accessor, Setter } from 'solid-js'

const ScrollAreaRootContext = createContext<
  ScrollAreaRootContextValue | undefined
>(undefined)
export { ScrollAreaRootContext }

/**
 * Reads the nearest {@link ScrollAreaRoot} context.
 *
 * @returns Context value.
 * @throws If used outside a ScrollArea root.
 */
export function useScrollAreaRootContext(): ScrollAreaRootContextValue {
  const context = useContext(ScrollAreaRootContext)
  if (context) return context

  throw new Error(
    'Base UI: ScrollAreaRootContext is missing. ScrollArea parts must be placed within <ScrollArea.Root>.'
  )
}

/**
 * Mutable DOM refs shared across Scroll Area parts.
 */
export interface ScrollAreaRootRefs {
  /** Root host element. */
  root: HTMLDivElement | null
  /** Scrollport that owns `scrollTop` / `scrollLeft`. */
  viewport: HTMLDivElement | null
  /** Vertical scrollbar track. */
  scrollbarY: HTMLDivElement | null
  /** Horizontal scrollbar track. */
  scrollbarX: HTMLDivElement | null
  /** Vertical thumb. */
  thumbY: HTMLDivElement | null
  /** Horizontal thumb. */
  thumbX: HTMLDivElement | null
  /** Corner at the intersection of both scrollbars. */
  corner: HTMLDivElement | null
}

/**
 * Shared state and handlers for parts nested under {@link ScrollAreaRoot}.
 */
export interface ScrollAreaRootContextValue {
  /** Measured corner size (CSS vars / layout offsets). */
  cornerSize: Accessor<Size>
  /** Updates {@link cornerSize}. */
  cornerSizeAssign: Setter<Size>
  /** Measured thumb size along both axes. */
  thumbSize: Accessor<Size>
  /** Updates {@link thumbSize}. */
  thumbSizeAssign: Setter<Size>
  /** Whether a scrollbar has been measured at least once. */
  hasMeasuredScrollbar: Accessor<boolean>
  /** Updates {@link hasMeasuredScrollbar}. */
  hasMeasuredScrollbarAssign: Setter<boolean>
  /** Whether the latest pointer interaction used touch. */
  touchModality: Accessor<boolean>
  /** Whether a non-touch pointer is hovering the root tree. */
  hovering: Accessor<boolean>
  /** Updates {@link hovering}. */
  hoveringAssign: Setter<boolean>
  /** Whether the horizontal axis is in the scrolling timeout window. */
  scrollingX: Accessor<boolean>
  /** Whether the vertical axis is in the scrolling timeout window. */
  scrollingY: Accessor<boolean>
  /** Shared part element refs. */
  refs: ScrollAreaRootRefs
  /**
   * Starts a thumb drag (pointer capture + snap disable).
   *
   * @param event - Pointer down on a thumb.
   */
  handlePointerDown: (event: PointerEvent) => void
  /**
   * Updates viewport scroll from an active thumb drag.
   *
   * @param event - Pointer move while dragging.
   */
  handlePointerMove: (event: PointerEvent) => void
  /**
   * Ends a thumb drag and restores scroll-snap.
   *
   * @param event - Pointer up/cancel for the active pointer.
   */
  handlePointerUp: (event: PointerEvent) => void
  /**
   * Marks axes as scrolling from a viewport scroll position change.
   *
   * @param scrollPosition - Current `{ x, y }` scroll offsets.
   */
  handleScroll: (scrollPosition: Coords) => void
  /** Disables CSS scroll-snap on the viewport for the duration of a drag. */
  disableViewportSnap: () => void
  /** Stable id prefix for part `data-id` attributes. */
  rootId: string
  /** Whether each scrollbar/corner should stay hidden. */
  hiddenState: Accessor<HiddenState>
  /** Updates {@link hiddenState}. */
  hiddenStateAssign: Setter<HiddenState>
  /** Overflow presence on each edge (past threshold). */
  overflowEdges: Accessor<OverflowEdges>
  /** Updates {@link overflowEdges}. */
  overflowEdgesAssign: Setter<OverflowEdges>
  /** Public root state used for data attributes / `render` props. */
  viewportState: ScrollAreaRootState
  /** Normalized per-edge overflow threshold in pixels. */
  overflowEdgeThreshold: Accessor<{
    xStart: number
    xEnd: number
    yStart: number
    yEnd: number
  }>
}
