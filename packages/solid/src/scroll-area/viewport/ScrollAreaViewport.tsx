import {
  Timeout,
  clamp,
  normalizeScrollOffset,
  platform,
} from '@script-augur/base-ui-utils'
import { createEffect, onCleanup, onMount, splitProps, untrack } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useDirection } from '../../internals/direction'
import { styleDisableScrollbar } from '../../internals/styleDisableScrollbar'
import { MIN_THUMB_SIZE } from '../constants'
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext'
import { scrollAreaStateAttributesMapping } from '../root/stateAttributes'
import { getOffset } from '../utils/getOffset'

import { ScrollAreaViewportContext } from './ScrollAreaViewportContext'

import type { RenderProp } from '../../internals/createRender'
import type { HiddenState, ScrollAreaRootState } from '../root/ScrollAreaRoot'
import type { JSX } from 'solid-js'

// CSS variable names inlined so `ScrollAreaViewportCssVars` tree-shakes out.
const OVERFLOW_EDGE_VARS = [
  '--scroll-area-overflow-x-start',
  '--scroll-area-overflow-x-end',
  '--scroll-area-overflow-y-start',
  '--scroll-area-overflow-y-end',
]

// Module-level flag to ensure we only register the CSS properties once,
// regardless of how many Scroll Area components are mounted.
let scrollAreaOverflowVarsRegistered = false

/**
 * The actual scrollable container of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 *
 * @param componentProps - Viewport props (`render`, …).
 * @returns A Solid JSX element.
 */
export function ScrollAreaViewport(
  componentProps: ScrollAreaViewportProps
): JSX.Element {
  const context = useScrollAreaRootContext()
  const direction = useDirection()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const scrollEndTimeout = new Timeout()
  const waitForAnimationsTimeout = new Timeout()
  const lastMeasuredViewportMetrics: [number, number, number, number] = [
    NaN,
    NaN,
    NaN,
    NaN,
  ]

  let programmaticScroll = true

  onMount(() => {
    removeCSSVariableInheritance()
  })

  onMount(() => {
    if (context.refs.viewport?.matches(':hover')) {
      context.hoveringAssign(true)
    }
  })

  onMount(() => {
    const viewport = context.refs.viewport
    if (typeof ResizeObserver === 'undefined' || !viewport) return

    let hasInitialized = false
    const resizeObserver = new ResizeObserver(() => {
      if (!hasInitialized) {
        hasInitialized = true
        if (
          lastMeasuredViewportMetrics[0] === viewport.clientHeight &&
          lastMeasuredViewportMetrics[1] === viewport.scrollHeight &&
          lastMeasuredViewportMetrics[2] === viewport.clientWidth &&
          lastMeasuredViewportMetrics[3] === viewport.scrollWidth
        ) {
          return
        }
      }

      computeThumbPosition()
    })

    resizeObserver.observe(viewport)

    waitForAnimationsTimeout.start(0, () => {
      const animations = viewport.getAnimations({ subtree: true })
      if (animations.length === 0) return

      Promise.allSettled(animations.map(animation => animation.finished))
        .then(computeThumbPosition)
        .catch(() => {})
    })

    onCleanup(() => {
      resizeObserver.disconnect()
      waitForAnimationsTimeout.clear()
    })
  })

  createEffect(() => {
    void context.hiddenState()
    void direction()
    void context.overflowEdgeThreshold()
    queueMicrotask(computeThumbPosition)
  })

  onCleanup(() => {
    scrollEndTimeout.clear()
    waitForAnimationsTimeout.clear()
  })

  // `untrack` so Provider's children memo doesn't remount the scrollport when
  // overflow-edge signals update (would reset scrollTop).
  return (
    <ScrollAreaViewportContext.Provider value={{ computeThumbPosition }}>
      {untrack(() =>
        createRender<ScrollAreaViewportState, Record<string, unknown>>({
          defaultElement: 'div',
          state: context.viewportState,
          render: local.render,
          stateAttributesMapping: scrollAreaStateAttributesMapping,
          ref: [
            local.ref as ((el: Element) => void) | undefined,
            (el: Element | null | undefined) => {
              context.refs.viewport = (el as HTMLDivElement | null) ?? null
            },
          ],
          props: [
            {
              role: 'presentation',
              get 'data-id'() {
                return context.rootId ? `${context.rootId}-viewport` : undefined
              },
              get tabIndex() {
                const hidden = context.hiddenState()
                return hidden.x && hidden.y ? -1 : 0
              },
              get class() {
                return mergedClass()
              },
              get style() {
                return mergedStyle()
              },
              onScroll() {
                if (!context.refs.viewport) {
                  return
                }

                computeThumbPosition()

                if (context.touchModality() || !programmaticScroll) {
                  context.handleScroll({
                    x: context.refs.viewport.scrollLeft,
                    y: context.refs.viewport.scrollTop,
                  })
                }

                scrollEndTimeout.start(100, () => {
                  programmaticScroll = true
                })
              },
              onWheel: handleUserInteraction,
              onPointerMove: handleUserInteraction,
              onPointerEnter: handleUserInteraction,
              onKeyDown: handleUserInteraction,
              get children() {
                return local.children
              },
            },
            elementProps as Record<string, unknown>,
          ],
        })
      )}
    </ScrollAreaViewportContext.Provider>
  )

  /**
   * Recomputes thumb sizes/offsets, overflow CSS vars, and hidden/edge state
   * from the current viewport metrics.
   */
  function computeThumbPosition() {
    const viewportEl = context.refs.viewport
    const scrollbarYEl = context.refs.scrollbarY
    const scrollbarXEl = context.refs.scrollbarX
    const thumbYEl = context.refs.thumbY
    const thumbXEl = context.refs.thumbX
    const cornerEl = context.refs.corner

    if (!viewportEl) return

    const scrollableContentHeight = viewportEl.scrollHeight
    const scrollableContentWidth = viewportEl.scrollWidth
    const viewportHeight = viewportEl.clientHeight
    const viewportWidth = viewportEl.clientWidth
    const scrollTop = viewportEl.scrollTop
    const scrollLeft = viewportEl.scrollLeft
    const isFirstMeasurement = Number.isNaN(lastMeasuredViewportMetrics[0])

    lastMeasuredViewportMetrics[0] = viewportHeight
    lastMeasuredViewportMetrics[1] = scrollableContentHeight
    lastMeasuredViewportMetrics[2] = viewportWidth
    lastMeasuredViewportMetrics[3] = scrollableContentWidth

    if (isFirstMeasurement) {
      context.hasMeasuredScrollbarAssign(true)
    }

    if (scrollableContentHeight === 0 || scrollableContentWidth === 0) {
      return
    }

    const nextHiddenState = getHiddenState(viewportEl)
    const scrollbarYHidden = nextHiddenState.y
    const scrollbarXHidden = nextHiddenState.x
    const ratioX = viewportWidth / scrollableContentWidth
    const ratioY = viewportHeight / scrollableContentHeight
    const maxScrollLeft = Math.max(0, scrollableContentWidth - viewportWidth)
    const maxScrollTop = Math.max(0, scrollableContentHeight - viewportHeight)

    let scrollLeftFromStart = 0
    let scrollLeftFromEnd = 0
    if (!scrollbarXHidden) {
      scrollLeftFromStart = normalizeScrollOffset(
        direction() === 'rtl' ? -scrollLeft : scrollLeft,
        maxScrollLeft
      )
      scrollLeftFromEnd = maxScrollLeft - scrollLeftFromStart
    }

    const scrollTopFromStart = scrollbarYHidden
      ? 0
      : normalizeScrollOffset(scrollTop, maxScrollTop)
    const scrollTopFromEnd = scrollbarYHidden
      ? 0
      : maxScrollTop - scrollTopFromStart
    const nextWidth = scrollbarXHidden ? 0 : viewportWidth
    const nextHeight = scrollbarYHidden ? 0 : viewportHeight

    let nextCornerWidth = 0
    let nextCornerHeight = 0
    if (!scrollbarXHidden && !scrollbarYHidden) {
      nextCornerWidth = scrollbarYEl?.offsetWidth || 0
      nextCornerHeight = scrollbarXEl?.offsetHeight || 0
    }

    const cornerSize = context.cornerSize()
    const cornerNotYetSized = cornerSize.width === 0 && cornerSize.height === 0
    const cornerWidthOffset = cornerNotYetSized ? nextCornerWidth : 0
    const cornerHeightOffset = cornerNotYetSized ? nextCornerHeight : 0

    const scrollbarXOffset = getOffset(scrollbarXEl, 'padding', 'x')
    const scrollbarYOffset = getOffset(scrollbarYEl, 'padding', 'y')
    const thumbXOffset = getOffset(thumbXEl, 'margin', 'x')
    const thumbYOffset = getOffset(thumbYEl, 'margin', 'y')

    const idealNextWidth = nextWidth - scrollbarXOffset - thumbXOffset
    const idealNextHeight = nextHeight - scrollbarYOffset - thumbYOffset

    const maxNextWidth = scrollbarXEl
      ? Math.min(scrollbarXEl.offsetWidth - cornerWidthOffset, idealNextWidth)
      : idealNextWidth
    const maxNextHeight = scrollbarYEl
      ? Math.min(
          scrollbarYEl.offsetHeight - cornerHeightOffset,
          idealNextHeight
        )
      : idealNextHeight

    const clampedNextWidth = Math.max(MIN_THUMB_SIZE, maxNextWidth * ratioX)
    const clampedNextHeight = Math.max(MIN_THUMB_SIZE, maxNextHeight * ratioY)

    context.thumbSizeAssign(prevSize =>
      pickState(prevSize, {
        width: clampedNextWidth,
        height: clampedNextHeight,
      })
    )

    if (scrollbarYEl && thumbYEl) {
      const maxThumbOffsetY =
        scrollbarYEl.offsetHeight -
        clampedNextHeight -
        scrollbarYOffset -
        thumbYOffset

      const thumbOffsetY = applyOverscrollThumb(
        thumbYEl,
        '--scroll-area-thumb-height',
        scrollTop,
        maxScrollTop,
        scrollableContentHeight,
        clampedNextHeight,
        maxThumbOffsetY
      )
      thumbYEl.style.transform = `translate3d(0,${thumbOffsetY}px,0)`
    }

    if (scrollbarXEl && thumbXEl) {
      const maxThumbOffsetX =
        scrollbarXEl.offsetWidth -
        clampedNextWidth -
        scrollbarXOffset -
        thumbXOffset
      const scrollFromStart = direction() === 'rtl' ? -scrollLeft : scrollLeft

      const offsetX = applyOverscrollThumb(
        thumbXEl,
        '--scroll-area-thumb-width',
        scrollFromStart,
        maxScrollLeft,
        scrollableContentWidth,
        clampedNextWidth,
        maxThumbOffsetX
      )
      thumbXEl.style.transform = `translate3d(${direction() === 'rtl' ? -offsetX : offsetX}px,0,0)`
    }

    const overflowMetricsPx = [
      scrollLeftFromStart,
      scrollLeftFromEnd,
      scrollTopFromStart,
      scrollTopFromEnd,
    ]

    OVERFLOW_EDGE_VARS.forEach((cssVar, index) => {
      viewportEl.style.setProperty(cssVar, `${overflowMetricsPx[index]}px`)
    })

    if (cornerEl) {
      context.cornerSizeAssign(prevSize =>
        pickState(prevSize, {
          width: nextCornerWidth,
          height: nextCornerHeight,
        })
      )
    }

    context.hiddenStateAssign(prevState =>
      pickState(prevState, nextHiddenState)
    )

    const threshold = context.overflowEdgeThreshold()
    const nextOverflowEdges = {
      xStart: !scrollbarXHidden && scrollLeftFromStart > threshold.xStart,
      xEnd: !scrollbarXHidden && scrollLeftFromEnd > threshold.xEnd,
      yStart: !scrollbarYHidden && scrollTopFromStart > threshold.yStart,
      yEnd: !scrollbarYHidden && scrollTopFromEnd > threshold.yEnd,
    }

    context.overflowEdgesAssign(prev => pickState(prev, nextOverflowEdges))
  }

  /**
   * Marks the next scroll events as user-driven (not programmatic).
   */
  function handleUserInteraction() {
    programmaticScroll = false
  }

  /**
   * Merges overflow styles with any user `style` prop.
   *
   * @returns Style object or user string style.
   */
  function mergedStyle(): JSX.CSSProperties | string | undefined {
    const base: JSX.CSSProperties = {
      overflow: 'scroll',
    }
    const userStyle = local.style
    if (userStyle == null) return base
    if (typeof userStyle === 'string') return userStyle
    return { ...base, ...userStyle }
  }

  /**
   * Combines the native-scrollbar-hiding class with any user `class`.
   *
   * @returns Space-separated class string.
   */
  function mergedClass() {
    const userClass = local.class
    if (!userClass) return styleDisableScrollbar.className
    return `${styleDisableScrollbar.className} ${userClass}`
  }
}

/** Public state exposed to `render` functions. */
export interface ScrollAreaViewportState
  extends ScrollAreaRootState, Record<string, unknown> {}

/** Props for {@link ScrollAreaViewport}. */
export type ScrollAreaViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ScrollAreaViewportState, Record<string, unknown>>
}

/**
 * Removes inheritance of the scroll area overflow CSS variables, which
 * improves rendering performance in complex scroll areas with deep subtrees.
 */
function removeCSSVariableInheritance() {
  if (
    scrollAreaOverflowVarsRegistered ||
    // When `inherits: false`, specifying `inherit` on child elements doesn't work
    // in Safari. To let CSS features work correctly, this optimization must be skipped.
    platform.engine.webkit
  ) {
    return
  }

  if (typeof CSS !== 'undefined' && 'registerProperty' in CSS) {
    OVERFLOW_EDGE_VARS.forEach(name => {
      try {
        CSS.registerProperty({
          name,
          syntax: '<length>',
          inherits: false,
          initialValue: '0px',
        })
      } catch {
        /* ignore already-registered */
      }
    })
  }

  scrollAreaOverflowVarsRegistered = true
}

/**
 * Derives which scrollbars and corner should stay hidden from viewport metrics.
 *
 * @param viewport - The scrollport element.
 * @returns Hidden flags for `x`, `y`, and `corner`.
 */
function getHiddenState(viewport: HTMLElement): HiddenState {
  const y = viewport.clientHeight >= viewport.scrollHeight
  const x = viewport.clientWidth >= viewport.scrollWidth

  return {
    y,
    x,
    corner: y || x,
  }
}

/**
 * Returns `prev` when `next` is shallow-equal to it so setState bails out and
 * scroll-frame updates don't rebuild the root context.
 *
 * @param prev - Previous object.
 * @param next - Candidate next object.
 * @returns `prev` if shallow-equal, otherwise `next`.
 */
function pickState<T extends object>(prev: T, next: T): T {
  for (const key in next) {
    if (prev[key as keyof T] !== next[key as keyof T]) {
      return next
    }
  }

  return prev
}

/**
 * Sizes the thumb and returns its axis offset. On overscroll (Safari rubber-band
 * only) it shrinks against the pinned edge, damped by
 * `content / (content + overscroll)` to match native feedback.
 *
 * @param thumbEl - Thumb element to update.
 * @param sizeVar - CSS custom property for the along-axis size.
 * @param scrollFromStart - Scroll offset from the start edge.
 * @param maxScroll - Maximum scrollable distance on this axis.
 * @param content - Scrollable content size on this axis.
 * @param size - Ideal thumb size before overscroll damping.
 * @param maxThumbOffset - Maximum thumb travel along the track.
 * @returns Thumb offset in pixels.
 */
function applyOverscrollThumb(
  thumbEl: HTMLElement,
  sizeVar: string,
  scrollFromStart: number,
  maxScroll: number,
  content: number,
  size: number,
  maxThumbOffset: number
): number {
  const clamped = clamp(scrollFromStart, 0, maxScroll)
  const overscroll = scrollFromStart - clamped
  const nextSize = Math.max(
    MIN_THUMB_SIZE,
    (size * content) / (content + Math.abs(overscroll))
  )

  thumbEl.style.setProperty(sizeVar, overscroll ? `${nextSize}px` : '')

  const offset = maxScroll ? (clamped / maxScroll) * maxThumbOffset : 0
  return offset + (overscroll > 0 ? size - nextSize : 0)
}
