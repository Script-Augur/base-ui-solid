import { generateId } from '@script-augur/base-ui-utils'
import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useTooltipPortalContext } from '../portal/TooltipPortalContext'
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext'
import { useTooltipRootContext } from '../root/TooltipRootContext'
import { tooltipPopupStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

/**
 * A container for the tooltip contents.
 * Renders a `<div>` element with `role="tooltip"`.
 *
 * Must be rendered inside `<Tooltip.Positioner>`.
 *
 * Unlike `Popover.Popup` / `Dialog.Popup`, this never receives focus — there
 * is no `initialFocus` / `finalFocus`, matching upstream tooltip semantics.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 *
 * @param componentProps - Popup props.
 * @returns A Solid JSX element.
 */
export function TooltipPopup(componentProps: TooltipPopupProps): JSX.Element {
  useTooltipPortalContext()
  const context = useTooltipRootContext()
  const positioner = useTooltipPositionerContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'id',
  ])

  const popupId = local.id ?? generateId('base-ui-tooltip')

  const side = (): Side => positioner.side()
  const align = (): Align => positioner.align()

  const state: TooltipPopupState = {
    get open() {
      return context.open()
    },
    get side() {
      return side()
    },
    get align() {
      return align()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
    get instant() {
      return context.instantType()
    },
  }

  return createRender<TooltipPopupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      tooltipPopupStateAttributesMapping as StateAttributesMapping<TooltipPopupState>,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return popupId
      },
      role: 'tooltip',
      get ['attr:hidden']() {
        return context.mounted() ? undefined : true
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      onPointerEnter() {
        if (context.disableHoverablePopup()) return
        context.cancelScheduledClose()
      },
      onPointerLeave(event: PointerEvent) {
        if (context.disableHoverablePopup()) return
        context.scheduleClose(event)
      },
      children: local.children,
      ref(element: HTMLElement) {
        context.popupElementAssign(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}

/** Public state for {@link TooltipPopup}. */
export interface TooltipPopupState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  transitionStatus: TransitionStatus
  instant: string | undefined
}

/** Props for {@link TooltipPopup}. */
export type TooltipPopupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<TooltipPopupState, Record<string, unknown>>
}
