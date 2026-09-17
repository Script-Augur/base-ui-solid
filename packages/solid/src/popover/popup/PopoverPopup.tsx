import { generateId } from '@script-augur/base-ui-utils'
import { createEffect, mergeProps, splitProps, useContext } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { usePopoverPortalContext } from '../portal/PopoverPortalContext'
import { PopoverPositionerContext } from '../positioner/PopoverPositionerContext'
import { usePopoverRootContext } from '../root/PopoverRootContext'
import { popoverPopupStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

/**
 * A container for the popover contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 *
 * @param componentProps - Popup props (`initialFocus`, `finalFocus`, …).
 * @returns A Solid JSX element.
 */
export function PopoverPopup(componentProps: PopoverPopupProps): JSX.Element {
  usePopoverPortalContext()
  const context = usePopoverRootContext()
  const positioner = useContext(PopoverPositionerContext)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'initialFocus',
    'finalFocus',
    'ref',
    'id',
  ])

  const popupId = local.id ?? generateId('base-ui-popover')

  createEffect(() => {
    context.popupInitialFocusAssign(local.initialFocus)
    context.popupFinalFocusAssign(local.finalFocus)
  })

  const side = (): Side => positioner?.side() ?? 'bottom'
  const align = (): Align => positioner?.align() ?? 'center'

  const state: PopoverPopupState = {
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

  return createRender<PopoverPopupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      popoverPopupStateAttributesMapping as StateAttributesMapping<PopoverPopupState>,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return popupId
      },
      role: 'dialog',
      tabindex: -1,
      get 'aria-modal'() {
        return context.modal() === true ? true : undefined
      },
      get 'aria-labelledby'() {
        return context.titleElementId()
      },
      get 'aria-describedby'() {
        return context.descriptionElementId()
      },
      get ['attr:hidden']() {
        return context.mounted() ? undefined : true
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
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

/** Public state for {@link PopoverPopup}. */
export interface PopoverPopupState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  transitionStatus: TransitionStatus
  instant: string | undefined
}

/** Props for {@link PopoverPopup}. */
export type PopoverPopupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Element to focus when the popover opens.
   * - `false`: do not move focus
   * - `true` / omitted / `null`: first tabbable / popup (via focus trap)
   * - `HTMLElement`: focus that element
   */
  initialFocus?: boolean | HTMLElement | null
  /**
   * Element to focus when the popover closes.
   * - `false`: do not restore focus
   * - `true` / omitted / `null`: restore to trigger (via focus trap)
   * - `HTMLElement`: focus that element
   */
  finalFocus?: boolean | HTMLElement | null
  render?: RenderProp<PopoverPopupState, Record<string, unknown>>
}
