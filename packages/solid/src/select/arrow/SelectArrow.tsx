import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext'
import { useSelectRootContext } from '../root/SelectRootContext'

import { SelectArrowDataAttributes } from './SelectArrowDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

const OPEN_HOOK = { 'data-open': '' }
const CLOSED_HOOK = { 'data-closed': '' }

/**
 * Displays an element positioned against the select anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Arrow props.
 * @returns A Solid JSX element.
 */
export function SelectArrow(componentProps: SelectArrowProps): JSX.Element {
  const context = useSelectRootContext()
  const positioner = useSelectPositionerContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: SelectArrowState = {
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

  return createRender<SelectArrowState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: {
      open(value: unknown) {
        return value ? OPEN_HOOK : CLOSED_HOOK
      },
      uncentered(value: unknown) {
        return value ? { [SelectArrowDataAttributes.uncentered]: '' } : null
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

/** Public state for {@link SelectArrow}. */
export interface SelectArrowState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  uncentered: boolean
}

/** Props for {@link SelectArrow}. */
export type SelectArrowProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<SelectArrowState, Record<string, unknown>>
}
