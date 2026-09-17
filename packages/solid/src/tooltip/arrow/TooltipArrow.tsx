import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext'
import { useTooltipRootContext } from '../root/TooltipRootContext'

import { TooltipArrowDataAttributes } from './TooltipArrowDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

const OPEN_HOOK = { 'data-open': '' }
const CLOSED_HOOK = { 'data-closed': '' }

/**
 * Displays an element positioned against the tooltip anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 *
 * @param componentProps - Arrow props.
 * @returns A Solid JSX element.
 */
export function TooltipArrow(componentProps: TooltipArrowProps): JSX.Element {
  const context = useTooltipRootContext()
  const positioner = useTooltipPositionerContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: TooltipArrowState = {
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

  return createRender<TooltipArrowState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: {
      open(value: unknown) {
        return value ? OPEN_HOOK : CLOSED_HOOK
      },
      uncentered(value: unknown) {
        return value ? { [TooltipArrowDataAttributes.uncentered]: '' } : null
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

/** Public state for {@link TooltipArrow}. */
export interface TooltipArrowState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  uncentered: boolean
}

/** Props for {@link TooltipArrow}. */
export type TooltipArrowProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<TooltipArrowState, Record<string, unknown>>
}
