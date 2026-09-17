import { generateId } from '@script-augur/base-ui-utils'
import { mergeProps, splitProps, useContext } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useNavigationMenuPortalContext } from '../portal/NavigationMenuPortalContext'
import { NavigationMenuPositionerContext } from '../positioner/NavigationMenuPositionerContext'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'
import { navigationMenuPopupStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

/**
 * A container for the navigation menu contents.
 * Renders a `<nav>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Popup props.
 * @returns A Solid JSX element.
 */
export function NavigationMenuPopup(
  componentProps: NavigationMenuPopupProps
): JSX.Element {
  useNavigationMenuPortalContext()
  const context = useNavigationMenuRootContext()
  const positioner = useContext(NavigationMenuPositionerContext)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'id',
  ])

  const popupId = local.id ?? generateId('base-ui-navigation-menu')

  const side = (): Side => positioner?.side() ?? 'bottom'
  const align = (): Align => positioner?.align() ?? 'center'

  const state: NavigationMenuPopupState = {
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
    get anchorHidden() {
      return false
    },
  }

  return createRender<NavigationMenuPopupState, Record<string, unknown>>({
    defaultElement: 'nav',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      navigationMenuPopupStateAttributesMapping as StateAttributesMapping<NavigationMenuPopupState>,
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
      onPointerEnter() {
        context.onPopupPointerEnter()
      },
      onPointerLeave(event: PointerEvent) {
        context.onPopupPointerLeave(event)
      },
      ref(element: HTMLElement) {
        context.popupElementAssign(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element)
        }
      },
    }),
  })
}

/** Public state for {@link NavigationMenuPopup}. */
export interface NavigationMenuPopupState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  transitionStatus: TransitionStatus
  anchorHidden: boolean
}

/** Props for {@link NavigationMenuPopup}. */
export type NavigationMenuPopupProps = JSX.HTMLAttributes<HTMLElement> & {
  render?: RenderProp<NavigationMenuPopupState, Record<string, unknown>>
}
