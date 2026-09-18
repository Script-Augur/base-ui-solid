import { generateId } from '@script-augur/base-ui-utils'
import { mergeProps, splitProps, useContext } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useSelectPortalContext } from '../portal/SelectPortalContext'
import { SelectPositionerContext } from '../positioner/SelectPositionerContext'
import { useSelectRootContext } from '../root/SelectRootContext'
import { selectPopupStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

/**
 * A container for the select popup contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Popup props.
 * @returns A Solid JSX element.
 */
export function SelectPopup(componentProps: SelectPopupProps): JSX.Element {
  useSelectPortalContext()
  const context = useSelectRootContext()
  const positioner = useContext(SelectPositionerContext)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'id',
  ])

  const popupId = local.id ?? generateId('base-ui-select')

  const side = (): Side => positioner?.side() ?? 'bottom'
  const align = (): Align => positioner?.align() ?? 'start'

  const state: SelectPopupState = {
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

  return createRender<SelectPopupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      selectPopupStateAttributesMapping as StateAttributesMapping<SelectPopupState>,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return popupId
      },
      tabindex: -1,
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

/** Public state for {@link SelectPopup}. */
export interface SelectPopupState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  transitionStatus: TransitionStatus
  instant: string | undefined
}

/** Props for {@link SelectPopup}. */
export type SelectPopupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<SelectPopupState, Record<string, unknown>>
}
