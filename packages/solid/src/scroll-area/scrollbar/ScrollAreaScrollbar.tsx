import { contains, getTarget } from '@script-augur/base-ui-utils'
import {
  Show,
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useDirection } from '../../internals/direction'
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext'
import { scrollAreaStateAttributesMapping } from '../root/stateAttributes'
import { getOffset } from '../utils/getOffset'

import { ScrollAreaScrollbarContext } from './ScrollAreaScrollbarContext'
import { ScrollAreaScrollbarCssVars } from './ScrollAreaScrollbarCssVars'

import type { RenderProp } from '../../internals/createRender'
import type { ScrollAreaRootState } from '../root/ScrollAreaRoot'
import type { JSX } from 'solid-js'

/**
 * A vertical or horizontal scrollbar for the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 *
 * @param componentProps - Scrollbar props (`orientation`, `keepMounted`, …).
 * @returns A Solid JSX element.
 */
export function ScrollAreaScrollbar(
  componentProps: ScrollAreaScrollbarProps
): JSX.Element {
  const context = useScrollAreaRootContext()
  const direction = useDirection()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'orientation',
    'keepMounted',
  ])

  const [scrollbarEl, scrollbarElAssign] = createSignal<HTMLDivElement | null>(
    null
  )

  const orientation = () => local.orientation ?? 'vertical'
  const keepMounted = () => local.keepMounted ?? false
  const vertical = () => orientation() === 'vertical'
  const hideTrackUntilMeasured = () =>
    !context.hasMeasuredScrollbar() && !keepMounted()
  const isHidden = () =>
    vertical() ? context.hiddenState().y : context.hiddenState().x
  const shouldRender = () => keepMounted() || !isHidden()

  const state: ScrollAreaScrollbarState = {
    get scrolling() {
      return vertical() ? context.scrollingY() : context.scrollingX()
    },
    get hasOverflowX() {
      return context.viewportState.hasOverflowX
    },
    get hasOverflowY() {
      return context.viewportState.hasOverflowY
    },
    get overflowXStart() {
      return context.viewportState.overflowXStart
    },
    get overflowXEnd() {
      return context.viewportState.overflowXEnd
    },
    get overflowYStart() {
      return context.viewportState.overflowYStart
    },
    get overflowYEnd() {
      return context.viewportState.overflowYEnd
    },
    get cornerHidden() {
      return context.viewportState.cornerHidden
    },
    get hovering() {
      return context.hovering()
    },
    get orientation() {
      return orientation()
    },
  }

  createEffect(() => {
    if (!shouldRender()) return

    const el = scrollbarEl()
    if (!el) return

    // Non-passive listener so `preventDefault` works for wheel chaining in browsers.
    el.addEventListener('wheel', onScrollbarWheel, {
      passive: false,
    })
    onCleanup(() => {
      el.removeEventListener('wheel', onScrollbarWheel)
    })
  })

  return (
    <Show when={shouldRender()}>
      <ScrollAreaScrollbarContext.Provider value={orientation()}>
        {untrack(() =>
          createRender<ScrollAreaScrollbarState, Record<string, unknown>>({
            defaultElement: 'div',
            state,
            render: local.render,
            stateAttributesMapping: scrollAreaStateAttributesMapping,
            ref: [
              local.ref as ((el: Element) => void) | undefined,
              (el: Element | null | undefined) => {
                bindScrollbarElement((el as HTMLDivElement | null) ?? null)
              },
            ],
            props: [
              {
                get 'data-id'() {
                  return context.rootId
                    ? `${context.rootId}-scrollbar`
                    : undefined
                },
                onPointerDown: handlePointerDown,
                onPointerUp: context.handlePointerUp,
                onPointerCancel: context.handlePointerUp,
                get style() {
                  return mergedStyle()
                },
                get class() {
                  return local.class
                },
                get children() {
                  return local.children
                },
              },
              elementProps as Record<string, unknown>,
            ],
          })
        )}
      </ScrollAreaScrollbarContext.Provider>
    </Show>
  )

  /**
   * Merges absolute track positioning and thumb-size CSS vars with user `style`.
   *
   * @returns Style object or user string style.
   */
  function mergedStyle(): JSX.CSSProperties | string | undefined {
    const isVertical = vertical()
    const thumb = context.thumbSize()
    const base: JSX.CSSProperties = {
      position: 'absolute',
      'touch-action': 'none',
      '-webkit-user-select': 'none',
      'user-select': 'none',
      visibility: hideTrackUntilMeasured() ? 'hidden' : undefined,
      ...(isVertical
        ? {
            top: 0,
            bottom: 'var(--scroll-area-corner-height)',
            'inset-inline-end': 0,
            [ScrollAreaScrollbarCssVars.scrollAreaThumbHeight]: `${thumb.height}px`,
          }
        : {
            'inset-inline-start': 0,
            'inset-inline-end': 'var(--scroll-area-corner-width)',
            bottom: 0,
            [ScrollAreaScrollbarCssVars.scrollAreaThumbWidth]: `${thumb.width}px`,
          }),
    }
    const userStyle = local.style
    if (userStyle == null) return base
    if (typeof userStyle === 'string') return userStyle
    return { ...base, ...userStyle }
  }

  /**
   * Stores the track element and mirrors it onto the root refs bag for the
   * active orientation.
   *
   * @param node - Mounted scrollbar host, or `null` on unmount.
   */
  function bindScrollbarElement(node: HTMLDivElement | null) {
    scrollbarElAssign(node)
    context.refs[vertical() ? 'scrollbarY' : 'scrollbarX'] = node
  }

  /**
   * Scrolls the viewport from wheel events over the track, clamping at edges
   * and preventing default when the event is consumed.
   *
   * @param event - Wheel event on the scrollbar track.
   */
  function onScrollbarWheel(event: WheelEvent) {
    const viewportEl = context.refs.viewport
    if (!viewportEl || event.ctrlKey) return

    const isVertical = vertical()
    const dir = direction()
    const horizontal = !isVertical
    const scrollProperty = horizontal ? 'scrollLeft' : 'scrollTop'
    const delta = horizontal ? event.deltaX : event.deltaY
    if (delta === 0) return

    const maxScroll = horizontal
      ? viewportEl.scrollWidth - viewportEl.clientWidth
      : viewportEl.scrollHeight - viewportEl.clientHeight
    const minScroll = horizontal && dir === 'rtl' ? -maxScroll : 0
    const maxScrollValue = horizontal && dir === 'rtl' ? 0 : maxScroll
    const scrollValue = viewportEl[scrollProperty]

    if (
      (scrollValue <= minScroll && delta < 0) ||
      (scrollValue >= maxScrollValue && delta > 0)
    ) {
      return
    }

    event.preventDefault()

    viewportEl[scrollProperty] = Math.min(
      maxScrollValue,
      Math.max(minScroll, scrollValue + delta)
    )

    context.handleScroll({
      x: viewportEl.scrollLeft,
      y: viewportEl.scrollTop,
    })
  }

  /**
   * Jumps the viewport from a click on the track (outside the thumb), then
   * starts a drag via the root pointer handlers.
   *
   * @param event - Pointer down on the scrollbar track (primary button only).
   */
  function handlePointerDown(event: PointerEvent) {
    if (event.button > 0) return

    const target = getTarget(event) as Element | null
    const isVertical = vertical()
    const thumbEl = isVertical ? context.refs.thumbY : context.refs.thumbX

    if (thumbEl && contains(thumbEl, target)) return

    const viewportEl = context.refs.viewport
    if (!viewportEl) return

    const trackEl = isVertical
      ? context.refs.scrollbarY
      : context.refs.scrollbarX

    if (!thumbEl || !trackEl) return

    const axis = isVertical ? 'y' : 'x'
    const thumbOffset = getOffset(thumbEl, 'margin', axis)
    const scrollbarOffset = getOffset(trackEl, 'padding', axis)
    const thumbSizePx = isVertical ? thumbEl.offsetHeight : thumbEl.offsetWidth
    const trackRect = trackEl.getBoundingClientRect()
    const clickPosition = isVertical
      ? event.clientY -
        trackRect.top -
        thumbSizePx / 2 -
        scrollbarOffset +
        thumbOffset / 2
      : event.clientX -
        trackRect.left -
        thumbSizePx / 2 -
        scrollbarOffset +
        thumbOffset / 2

    const scrollableSize = isVertical
      ? viewportEl.scrollHeight
      : viewportEl.scrollWidth
    const viewportSize = isVertical
      ? viewportEl.clientHeight
      : viewportEl.clientWidth
    const trackSize = isVertical ? trackEl.offsetHeight : trackEl.offsetWidth

    const maxThumbOffset =
      trackSize - thumbSizePx - scrollbarOffset - thumbOffset
    if (maxThumbOffset <= 0) return

    const scrollRatio = clickPosition / maxThumbOffset
    const maxScrollDistance = scrollableSize - viewportSize

    context.disableViewportSnap()

    if (isVertical) {
      viewportEl.scrollTop = scrollRatio * maxScrollDistance
    } else if (direction() === 'rtl') {
      viewportEl.scrollLeft = -(1 - scrollRatio) * maxScrollDistance
    } else {
      viewportEl.scrollLeft = scrollRatio * maxScrollDistance
    }

    context.handleScroll({
      x: viewportEl.scrollLeft,
      y: viewportEl.scrollTop,
    })

    context.handlePointerDown(event)
  }
}

/**
 * Public state exposed to `render` functions.
 */
export interface ScrollAreaScrollbarState
  extends ScrollAreaRootState, Record<string, unknown> {
  /**
   * Whether the scroll area is being hovered.
   */
  hovering: boolean
  /**
   * Whether the scroll area is being scrolled.
   */
  scrolling: boolean
  /**
   * The orientation of the scrollbar.
   */
  orientation: 'vertical' | 'horizontal'
}

/**
 * Props for {@link ScrollAreaScrollbar}.
 */
export type ScrollAreaScrollbarProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Whether the scrollbar controls vertical or horizontal scroll.
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal'
  /**
   * Whether to keep the HTML element in the DOM when the viewport isn't scrollable.
   * @default false
   */
  keepMounted?: boolean
  render?: RenderProp<ScrollAreaScrollbarState, Record<string, unknown>>
}
