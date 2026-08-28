import { mergeProps, onCleanup, onMount, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext'
import { scrollAreaStateAttributesMapping } from '../root/stateAttributes'
import { useScrollAreaViewportContext } from '../viewport/ScrollAreaViewportContext'

import type { RenderProp } from '../../internals/createRender'
import type { ScrollAreaRootState } from '../root/ScrollAreaRoot'
import type { JSX } from 'solid-js'

/**
 * A container for the content of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 *
 * @param componentProps - Content props (`render`, …).
 * @returns A Solid JSX element.
 */
export function ScrollAreaContent(
  componentProps: ScrollAreaContentProps
): JSX.Element {
  const { computeThumbPosition } = useScrollAreaViewportContext()
  const context = useScrollAreaRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  let contentWrapper: HTMLDivElement | null = null
  const computeOnInitialResize = context.hasMeasuredScrollbar()

  onMount(() => {
    if (typeof ResizeObserver === 'undefined') return

    let hasInitialized = false
    const resizeObserver = new ResizeObserver(() => {
      if (!hasInitialized) {
        hasInitialized = true
        if (!computeOnInitialResize) return
      }

      computeThumbPosition()
    })

    if (contentWrapper) resizeObserver.observe(contentWrapper)

    onCleanup(() => resizeObserver.disconnect())
  })

  const mergedStyle = (): JSX.CSSProperties | string | undefined => {
    const base: JSX.CSSProperties = {
      'min-width': 'fit-content',
    }
    const userStyle = local.style
    if (userStyle == null) return base
    if (typeof userStyle === 'string') return userStyle
    return { ...base, ...userStyle }
  }

  return createRender<ScrollAreaContentState, Record<string, unknown>>({
    defaultElement: 'div',
    state: context.viewportState,
    render: local.render,
    stateAttributesMapping: scrollAreaStateAttributesMapping,
    ref: [
      local.ref as ((el: Element) => void) | undefined,
      (el: Element | null | undefined) => {
        contentWrapper = (el as HTMLDivElement | null) ?? null
      },
    ],
    props: mergeProps(elementProps as Record<string, unknown>, {
      role: 'presentation',
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
}

/** Public state exposed to `render` functions. */
export interface ScrollAreaContentState
  extends ScrollAreaRootState, Record<string, unknown> {}

/** Props for {@link ScrollAreaContent}. */
export type ScrollAreaContentProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ScrollAreaContentState, Record<string, unknown>>
}
