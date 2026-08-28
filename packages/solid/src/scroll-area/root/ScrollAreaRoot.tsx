import { Timeout, contains, generateId } from '@script-augur/base-ui-utils'
import {
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { ensureDisableScrollbarStyle } from '../../internals/styleDisableScrollbar'
import { SCROLL_TIMEOUT } from '../constants'
import { getOffset } from '../utils/getOffset'

import { ScrollAreaRootContext } from './ScrollAreaRootContext'
import { ScrollAreaRootCssVars } from './ScrollAreaRootCssVars'
import { scrollAreaStateAttributesMapping } from './stateAttributes'

import type { ScrollAreaRootRefs } from './ScrollAreaRootContext'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

const DEFAULT_COORDS = { x: 0, y: 0 }
const DEFAULT_SIZE = { width: 0, height: 0 }
const DEFAULT_OVERFLOW_EDGES = {
  xStart: false,
  xEnd: false,
  yStart: false,
  yEnd: false,
}
const DEFAULT_HIDDEN_STATE = { x: true, y: true, corner: true }

/**
 * Groups all parts of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 *
 * @param componentProps - Root props (`overflowEdgeThreshold`, `render`, …).
 * @returns A Solid JSX element.
 */
export function ScrollAreaRoot(
  componentProps: ScrollAreaRootProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'overflowEdgeThreshold',
  ])

  const refs: ScrollAreaRootRefs = {
    root: null,
    viewport: null,
    scrollbarY: null,
    scrollbarX: null,
    thumbY: null,
    thumbX: null,
    corner: null,
  }

  const rootId = generateId('scroll-area')
  const scrollYTimeout = new Timeout()
  const scrollXTimeout = new Timeout()

  const [hovering, hoveringAssign] = createSignal(false)
  const [scrollingX, scrollingXAssign] = createSignal(false)
  const [scrollingY, scrollingYAssign] = createSignal(false)
  const [touchModality, touchModalityAssign] = createSignal(false)
  const [hasMeasuredScrollbar, hasMeasuredScrollbarAssign] = createSignal(false)
  const [cornerSize, cornerSizeAssign] = createSignal<Size>(DEFAULT_SIZE)
  const [thumbSize, thumbSizeAssign] = createSignal<Size>(DEFAULT_SIZE)
  const [overflowEdges, overflowEdgesAssign] = createSignal<OverflowEdges>(
    DEFAULT_OVERFLOW_EDGES
  )
  const [hiddenState, hiddenStateAssign] =
    createSignal<HiddenState>(DEFAULT_HIDDEN_STATE)

  const overflowEdgeThreshold = createMemo(() =>
    normalizeOverflowEdgeThreshold(local.overflowEdgeThreshold)
  )

  const state: ScrollAreaRootState = {
    get scrolling() {
      return scrollingX() || scrollingY()
    },
    get hasOverflowX() {
      return !hiddenState().x
    },
    get hasOverflowY() {
      return !hiddenState().y
    },
    get overflowXStart() {
      return overflowEdges().xStart
    },
    get overflowXEnd() {
      return overflowEdges().xEnd
    },
    get overflowYStart() {
      return overflowEdges().yStart
    },
    get overflowYEnd() {
      return overflowEdges().yEnd
    },
    get cornerHidden() {
      return hiddenState().corner
    },
  }

  const contextValue = {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleScroll,
    disableViewportSnap,
    cornerSize,
    cornerSizeAssign,
    thumbSize,
    thumbSizeAssign,
    hasMeasuredScrollbar,
    hasMeasuredScrollbarAssign,
    touchModality,
    refs,
    scrollingX,
    scrollingY,
    hovering,
    hoveringAssign,
    rootId,
    hiddenState,
    hiddenStateAssign,
    overflowEdges,
    overflowEdgesAssign,
    viewportState: state,
    overflowEdgeThreshold,
  }
  let activePointerId: number | null = null
  let startY = 0
  let startX = 0
  let startScrollTop = 0
  let startScrollLeft = 0
  let currentOrientation: 'vertical' | 'horizontal' = 'vertical'
  let scrollPosition: Coords = DEFAULT_COORDS
  let savedSnapType: string | null = null

  onMount(() => {
    const cleanupStyle = ensureDisableScrollbarStyle()
    onCleanup(cleanupStyle)
  })

  onCleanup(() => {
    scrollYTimeout.clear()
    scrollXTimeout.clear()
  })

  return (
    <ScrollAreaRootContext.Provider value={contextValue}>
      {untrack(() =>
        createRender<ScrollAreaRootState, Record<string, unknown>>({
          defaultElement: 'div',
          state,
          render: local.render,
          stateAttributesMapping: scrollAreaStateAttributesMapping,
          ref: [
            local.ref as ((el: Element) => void) | undefined,
            (el: Element | null | undefined) => {
              refs.root = (el as HTMLDivElement | null) ?? null
            },
          ],
          props: mergeProps(elementProps as Record<string, unknown>, {
            role: 'presentation',
            onPointerEnter: handlePointerEnterOrMove,
            // React simulates `onPointerEnter` from bubbling `pointerover`; Solid's
            // `onPointerEnter` is the non-bubbling `pointerenter`. Listen to
            // `pointerover` as well so child-targeted moves update hovering.
            onPointerOver: handlePointerEnterOrMove,
            onPointerMove: handlePointerEnterOrMove,
            onPointerDown: handleTouchModalityChange,
            onPointerLeave() {
              hoveringAssign(false)
            },
            get style() {
              return mergedStyle()
            },
            get class() {
              return local.class
            },
            get children() {
              return local.children
            },
          }),
        })
      )}
    </ScrollAreaRootContext.Provider>
  )

  /**
   * Merges root positioning/CSS vars with any user `style` prop.
   *
   * @returns Style object or user string style.
   */
  function mergedStyle(): JSX.CSSProperties | string | undefined {
    const base: JSX.CSSProperties = {
      position: 'relative',
      [ScrollAreaRootCssVars.scrollAreaCornerHeight]: `${cornerSize().height}px`,
      [ScrollAreaRootCssVars.scrollAreaCornerWidth]: `${cornerSize().width}px`,
    }
    const userStyle = local.style
    if (userStyle == null) return base
    if (typeof userStyle === 'string') return userStyle
    return { ...base, ...userStyle }
  }

  /**
   * Marks an axis as scrolling and schedules clearing after {@link SCROLL_TIMEOUT}.
   *
   * @param vertical - When `true`, updates the Y scrolling signal; otherwise X.
   */
  function startScrolling(vertical: boolean) {
    const scrollingAssign = vertical ? scrollingYAssign : scrollingXAssign
    const timeout = vertical ? scrollYTimeout : scrollXTimeout

    scrollingAssign(true)
    timeout.start(SCROLL_TIMEOUT, () => scrollingAssign(false))
  }

  /**
   * Diffs the latest scroll position against the last known coords and starts
   * scrolling state on any axis that moved.
   *
   * @param nextScrollPosition - Current `{ x, y }` scroll offsets from the viewport.
   */
  function handleScroll(nextScrollPosition: Coords) {
    const offsetX = nextScrollPosition.x - scrollPosition.x
    const offsetY = nextScrollPosition.y - scrollPosition.y

    scrollPosition = nextScrollPosition

    if (offsetY !== 0) startScrolling(true)
    if (offsetX !== 0) startScrolling(false)
  }

  /**
   * Temporarily disables CSS scroll-snap on the viewport while the thumb is
   * dragged (native scrollbars suppress snap during drag).
   */
  function disableViewportSnap() {
    const viewportEl = refs.viewport
    if (viewportEl && savedSnapType === null) {
      savedSnapType =
        viewportEl.style.scrollSnapType ||
        viewportEl.style.getPropertyValue('scroll-snap-type')
      viewportEl.style.setProperty('scroll-snap-type', 'none')
    }
  }

  /**
   * Begins a thumb drag: captures the pointer, records start coords/scroll, and
   * disables viewport snap for the gesture.
   *
   * @param event - Pointer down on a thumb (primary button only).
   */
  function handlePointerDown(event: PointerEvent) {
    // Primary is `0`. jsdom `fireEvent.pointerDown` often yields an Event with
    // `button` undefined (or `-1`); treat those as primary so drag/snap still work.
    if (event.button > 0) return

    if (activePointerId !== null) {
      const activeThumb =
        currentOrientation === 'vertical' ? refs.thumbY : refs.thumbX
      // A live drag holds capture for the active pointer — ignore other pointers.
      // No capture means the release went missing entirely, so let the new
      // pointer take over the latch instead of leaving dragging dead.
      if (activeThumb?.hasPointerCapture(activePointerId)) return
    }

    activePointerId = event.pointerId
    startY = event.clientY
    startX = event.clientX
    // Literal instead of enum member so the enum tree-shakes from production.
    currentOrientation = (event.currentTarget as Element).getAttribute(
      'data-orientation'
    ) as 'vertical' | 'horizontal'

    const viewportEl = refs.viewport
    if (viewportEl) {
      startScrollTop = viewportEl.scrollTop
      startScrollLeft = viewportEl.scrollLeft
      disableViewportSnap()
    }

    const thumb = currentOrientation === 'vertical' ? refs.thumbY : refs.thumbX
    if (thumb && typeof thumb.setPointerCapture === 'function') {
      thumb.setPointerCapture(event.pointerId)
    }
  }

  /**
   * Ends a thumb drag: clears scrolling, restores snap, and releases capture.
   *
   * @param event - Pointer up/cancel for the active drag pointer.
   */
  function handlePointerUp(event: PointerEvent) {
    if (event.pointerId !== activePointerId) return

    activePointerId = null
    const scrollingAssign =
      currentOrientation === 'vertical' ? scrollingYAssign : scrollingXAssign
    scrollingAssign(false)

    if (savedSnapType !== null) {
      if (refs.viewport) {
        refs.viewport.style.setProperty('scroll-snap-type', savedSnapType)
      }
      savedSnapType = null
    }

    const thumb = currentOrientation === 'vertical' ? refs.thumbY : refs.thumbX
    if (
      thumb &&
      typeof thumb.hasPointerCapture === 'function' &&
      thumb.hasPointerCapture(event.pointerId) &&
      typeof thumb.releasePointerCapture === 'function'
    ) {
      thumb.releasePointerCapture(event.pointerId)
    }
  }

  /**
   * Updates viewport scroll from thumb drag delta along the active orientation.
   *
   * @param event - Pointer move while a thumb drag is active.
   */
  function handlePointerMove(event: PointerEvent) {
    if (event.pointerId !== activePointerId) return

    // Treat a move without the primary button held as a missed release.
    if (event.buttons % 2 === 0) {
      handlePointerUp(event)
      return
    }

    const viewportEl = refs.viewport
    if (!viewportEl) return

    const vertical = currentOrientation === 'vertical'
    const thumbEl = vertical ? refs.thumbY : refs.thumbX
    const scrollbarEl = vertical ? refs.scrollbarY : refs.scrollbarX
    if (!thumbEl || !scrollbarEl) return

    const axis = vertical ? 'y' : 'x'
    const scrollbarOffset = getOffset(scrollbarEl, 'padding', axis)
    const thumbOffset = getOffset(thumbEl, 'margin', axis)
    const thumbSizePx = vertical ? thumbEl.offsetHeight : thumbEl.offsetWidth
    const trackSize = vertical
      ? scrollbarEl.offsetHeight
      : scrollbarEl.offsetWidth
    const maxThumbOffset =
      trackSize - thumbSizePx - scrollbarOffset - thumbOffset
    const delta = vertical ? event.clientY - startY : event.clientX - startX
    const scrollRatio = maxThumbOffset <= 0 ? 0 : delta / maxThumbOffset

    const scrollableSize = vertical
      ? viewportEl.scrollHeight
      : viewportEl.scrollWidth
    const viewportSize = vertical
      ? viewportEl.clientHeight
      : viewportEl.clientWidth
    const startScroll = vertical ? startScrollTop : startScrollLeft
    const nextScroll =
      startScroll + scrollRatio * (scrollableSize - viewportSize)

    if (vertical) {
      viewportEl.scrollTop = nextScroll
    } else {
      viewportEl.scrollLeft = nextScroll
    }
    event.preventDefault()

    startScrolling(vertical)
  }

  /**
   * Records whether the latest pointer interaction used touch modality.
   *
   * @param event - Any pointer event on the root.
   */
  function handleTouchModalityChange(event: PointerEvent) {
    touchModalityAssign(event.pointerType === 'touch')
  }

  /**
   * Updates touch modality and hovering (non-touch) when the pointer enters or
   * moves over the root tree.
   *
   * @param event - Pointer enter/over/move on the root.
   */
  function handlePointerEnterOrMove(event: PointerEvent) {
    handleTouchModalityChange(event)

    if (event.pointerType === 'touch') return

    const isTargetRootChild = contains(
      refs.root,
      event.target as Element | null
    )
    hoveringAssign(isTargetRootChild)
  }
}

export type HiddenState = typeof DEFAULT_HIDDEN_STATE
export type OverflowEdges = typeof DEFAULT_OVERFLOW_EDGES
export type Size = typeof DEFAULT_SIZE
export type Coords = typeof DEFAULT_COORDS

/**
 * Public state exposed to `render` functions.
 */
export interface ScrollAreaRootState extends Record<string, unknown> {
  /**
   * Whether the scroll area is being scrolled.
   */
  scrolling: boolean
  /**
   * Whether horizontal overflow is present.
   */
  hasOverflowX: boolean
  /**
   * Whether vertical overflow is present.
   */
  hasOverflowY: boolean
  /**
   * Whether there is overflow on the inline start side for the horizontal axis.
   */
  overflowXStart: boolean
  /**
   * Whether there is overflow on the inline end side for the horizontal axis.
   */
  overflowXEnd: boolean
  /**
   * Whether there is overflow on the block start side.
   */
  overflowYStart: boolean
  /**
   * Whether there is overflow on the block end side.
   */
  overflowYEnd: boolean
  /**
   * Whether the scrollbar corner is hidden.
   */
  cornerHidden: boolean
}

/**
 * Props for {@link ScrollAreaRoot}.
 */
export type ScrollAreaRootProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * The threshold in pixels that must be passed before the overflow edge attributes are applied.
   * Accepts a single number for all edges or an object to configure them individually.
   * @default 0
   */
  overflowEdgeThreshold?:
    | number
    | Partial<{
        xStart: number
        xEnd: number
        yStart: number
        yEnd: number
      }>
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ScrollAreaRootState, Record<string, unknown>>
}

/**
 * Normalizes a number or per-edge object into non-negative edge thresholds.
 *
 * @param threshold - Prop value from {@link ScrollAreaRootProps.overflowEdgeThreshold}.
 * @returns Edge thresholds with missing values treated as `0`.
 */
function normalizeOverflowEdgeThreshold(
  threshold: ScrollAreaRootProps['overflowEdgeThreshold'] | undefined
) {
  const thresholds =
    typeof threshold === 'number'
      ? {
          xStart: threshold,
          xEnd: threshold,
          yStart: threshold,
          yEnd: threshold,
        }
      : threshold

  return {
    xStart: Math.max(0, thresholds?.xStart || 0),
    xEnd: Math.max(0, thresholds?.xEnd || 0),
    yStart: Math.max(0, thresholds?.yStart || 0),
    yEnd: Math.max(0, thresholds?.yEnd || 0),
  }
}
