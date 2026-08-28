import { splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext'
import { useScrollAreaScrollbarContext } from '../scrollbar/ScrollAreaScrollbarContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * The draggable part of the scrollbar that indicates the current scroll position.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 *
 * @param componentProps - Thumb props (`render`, …).
 * @returns A Solid JSX element.
 */
export function ScrollAreaThumb(
  componentProps: ScrollAreaThumbProps
): JSX.Element {
  const context = useScrollAreaRootContext()
  const orientation = useScrollAreaScrollbarContext()
  const vertical = orientation === 'vertical'

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: ScrollAreaThumbState = {
    get scrolling() {
      return vertical ? context.scrollingY() : context.scrollingX()
    },
    get orientation() {
      return orientation
    },
  }

  const mergedStyle = (): JSX.CSSProperties | string | undefined => {
    const base: JSX.CSSProperties = {
      visibility: context.hasMeasuredScrollbar() ? undefined : 'hidden',
      ...(vertical
        ? { height: 'var(--scroll-area-thumb-height)' }
        : { width: 'var(--scroll-area-thumb-width)' }),
    }
    const userStyle = local.style
    if (userStyle == null) return base
    if (typeof userStyle === 'string') return userStyle
    return { ...base, ...userStyle }
  }

  return createRender<ScrollAreaThumbState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    ref: [
      local.ref as ((el: Element) => void) | undefined,
      (el: Element | null | undefined) => {
        const node = (el as HTMLDivElement | null) ?? null
        if (vertical) {
          context.refs.thumbY = node
        } else {
          context.refs.thumbX = node
        }
      },
    ],
    props: [
      {
        onPointerDown: context.handlePointerDown,
        onPointerMove: context.handlePointerMove,
        onPointerUp: context.handlePointerUp,
        onPointerCancel: context.handlePointerUp,
        get style() {
          return mergedStyle()
        },
        get class() {
          return local.class
        },
      },
      elementProps,
    ],
  })
}

/**
 * Public state exposed to `render` functions.
 */
export interface ScrollAreaThumbState extends Record<string, unknown> {
  /**
   * Whether the scroll area is being scrolled.
   */
  scrolling: boolean
  /**
   * The component orientation.
   */
  orientation: 'horizontal' | 'vertical'
}

/**
 * Props for {@link ScrollAreaThumb}.
 */
export type ScrollAreaThumbProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ScrollAreaThumbState, Record<string, unknown>>
}
