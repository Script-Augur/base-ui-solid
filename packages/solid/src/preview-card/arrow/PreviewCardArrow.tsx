import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { usePreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext'
import { usePreviewCardRootContext } from '../root/PreviewCardRootContext'

import { PreviewCardArrowDataAttributes } from './PreviewCardArrowDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

const OPEN_HOOK = { 'data-open': '' }
const CLOSED_HOOK = { 'data-closed': '' }

/**
 * Displays an element positioned against the preview-card anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 *
 * @param componentProps - Arrow props.
 * @returns A Solid JSX element.
 */
export function PreviewCardArrow(
  componentProps: PreviewCardArrowProps
): JSX.Element {
  const context = usePreviewCardRootContext()
  const positioner = usePreviewCardPositionerContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: PreviewCardArrowState = {
    get open() {
      return context.open()
    },
    get side() {
      return positioner.side()
    },
    get align() {
      return positioner.align()
    },
    get uncentered() {
      return positioner.arrowUncentered()
    },
  }

  return createRender<PreviewCardArrowState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: {
      open(value: unknown) {
        return value ? OPEN_HOOK : CLOSED_HOOK
      },
      uncentered(value: unknown) {
        return value
          ? { [PreviewCardArrowDataAttributes.uncentered]: '' }
          : null
      },
    },
    props: mergeProps(elementProps as Record<string, unknown>, {
      get class() {
        return local.class
      },
      get style() {
        const arrow = positioner.arrowStyles()
        const base: JSX.CSSProperties = { position: 'absolute', ...arrow }
        const user = local.style
        if (user && typeof user === 'object' && !Array.isArray(user)) {
          return { ...base, ...user }
        }
        return base
      },
      children: local.children,
      ref(element: HTMLElement) {
        positioner.arrowRef(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}

/** Public state for {@link PreviewCardArrow}. */
export interface PreviewCardArrowState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  uncentered: boolean
}

/** Props for {@link PreviewCardArrow}. */
export type PreviewCardArrowProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<PreviewCardArrowState, Record<string, unknown>>
}
