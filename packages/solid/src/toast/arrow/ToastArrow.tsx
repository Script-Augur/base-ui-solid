import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useToastPositionerContext } from '../positioner/ToastPositionerContext'

import { ToastArrowDataAttributes } from './ToastArrowDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { Align, Side } from '../../popover/positioner/placement'
import type { JSX } from 'solid-js'

/**
 * Displays an element positioned against the toast anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Arrow props.
 * @returns A Solid JSX element.
 */
export function ToastArrow(componentProps: ToastArrowProps): JSX.Element {
  const positioner = useToastPositionerContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: ToastArrowState = {
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

  return createRender<ToastArrowState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: {
      uncentered(value: unknown) {
        return value ? { [ToastArrowDataAttributes.uncentered]: '' } : null
      },
    },
    props: mergeProps(elementProps as Record<string, unknown>, {
      'aria-hidden': true,
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
      get children() {
        return local.children
      },
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
/** Public state for {@link ToastArrow}. */
export interface ToastArrowState extends Record<string, unknown> {
  side: Side
  align: Align
  uncentered: boolean
}
/** Props for {@link ToastArrow}. */
export type ToastArrowProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ToastArrowState, Record<string, unknown>>
}
