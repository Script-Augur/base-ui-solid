import { generateId } from '@script-augur/base-ui-utils'
import { mergeProps, splitProps, useContext } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useComboboxPortalContext } from '../portal/ComboboxPortalContext'
import { ComboboxPositionerContext } from '../positioner/ComboboxPositionerContext'
import { useComboboxRootContext } from '../root/ComboboxRootContext'
import { comboboxPopupStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

/**
 * A container for the combobox popup contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Popup props.
 * @returns A Solid JSX element.
 */
export function ComboboxPopup(componentProps: ComboboxPopupProps): JSX.Element {
  useComboboxPortalContext()
  const context = useComboboxRootContext()
  const positioner = useContext(ComboboxPositionerContext)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'id',
  ])

  const popupId = local.id ?? generateId('base-ui-combobox')

  const side = (): Side => positioner?.side() ?? 'bottom'
  const align = (): Align => positioner?.align() ?? 'start'

  const state: ComboboxPopupState = {
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
    get empty() {
      return context.listEmpty()
    },
  }

  return createRender<ComboboxPopupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      comboboxPopupStateAttributesMapping as StateAttributesMapping<ComboboxPopupState>,
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

/** Public state for {@link ComboboxPopup}. */
export interface ComboboxPopupState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  transitionStatus: TransitionStatus
  instant: string | undefined
  empty: boolean
}

/** Props for {@link ComboboxPopup}. */
export type ComboboxPopupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxPopupState, Record<string, unknown>>
}
