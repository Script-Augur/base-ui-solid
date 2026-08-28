import { Show, mergeProps, splitProps, untrack } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 *
 * @param componentProps - Corner props (`render`, …).
 * @returns A Solid JSX element.
 */
export function ScrollAreaCorner(
  componentProps: ScrollAreaCornerProps
): JSX.Element {
  const context = useScrollAreaRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: ScrollAreaCornerState = {}

  const mergedStyle = (): JSX.CSSProperties | string | undefined => {
    const size = context.cornerSize()
    const base: JSX.CSSProperties = {
      position: 'absolute',
      bottom: 0,
      'inset-inline-end': 0,
      width: `${size.width}px`,
      height: `${size.height}px`,
    }
    const userStyle = local.style
    if (userStyle == null) return base
    if (typeof userStyle === 'string') return userStyle
    return { ...base, ...userStyle }
  }

  return (
    <Show when={!context.hiddenState().corner}>
      {untrack(() =>
        createRender<ScrollAreaCornerState, Record<string, unknown>>({
          defaultElement: 'div',
          state,
          render: local.render,
          ref: [
            local.ref as ((el: Element) => void) | undefined,
            (el: Element | null | undefined) => {
              context.refs.corner = (el as HTMLDivElement | null) ?? null
            },
          ],
          props: mergeProps(elementProps as Record<string, unknown>, {
            get style() {
              return mergedStyle()
            },
            get class() {
              return local.class
            },
          }),
        })
      )}
    </Show>
  )
}

/** Public state exposed to `render` functions. */
export interface ScrollAreaCornerState extends Record<string, unknown> {}

/** Props for {@link ScrollAreaCorner}. */
export type ScrollAreaCornerProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ScrollAreaCornerState, Record<string, unknown>>
}
