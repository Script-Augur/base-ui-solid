import { generateId } from '@script-augur/base-ui-utils'
import { createEffect, mergeProps, splitProps, useContext } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useMenuPortalContext } from '../portal/MenuPortalContext'
import { MenuPositionerContext } from '../positioner/MenuPositionerContext'
import { useMenuRootContext } from '../root/MenuRootContext'
import { menuPopupStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

/**
 * A container for the menu contents.
 * Renders a `<div>` element with `role="menu"`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 *
 * @param componentProps - Popup props.
 * @returns A Solid JSX element.
 */
export function MenuPopup(componentProps: MenuPopupProps): JSX.Element {
  useMenuPortalContext()
  const context = useMenuRootContext()
  const positioner = useContext(MenuPositionerContext)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'finalFocus',
    'ref',
    'id',
  ])

  const popupId = local.id ?? context.store.select('floatingId') ?? generateId('base-ui-menu')

  createEffect(() => {
    context.popupFinalFocusAssign(local.finalFocus)
  })

  const side = (): Side => positioner?.side() ?? 'bottom'
  const align = (): Align => positioner?.align() ?? 'center'

  const state: MenuPopupState = {
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
    get nested() {
      return context.nested()
    },
  }

  return createRender<MenuPopupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      menuPopupStateAttributesMapping as StateAttributesMapping<MenuPopupState>,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return popupId
      },
      role: 'menu',
      tabindex: -1,
      get 'aria-orientation'() {
        return context.orientation()
      },
      get 'aria-labelledby'() {
        return context.triggerElement()?.id
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
      onMouseMove() {
        context.store.set('allowMouseEnter', true)
        if (context.parent.type === 'menu') {
          context.store.set('hoverEnabled', false)
        }
      },
      onClick() {
        if (context.store.select('hoverEnabled')) {
          context.store.set('hoverEnabled', false)
        }
      },
      onKeyDown(event: KeyboardEvent) {
        context.onPopupKeyDown(event)
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

/** Public state for {@link MenuPopup}. */
export interface MenuPopupState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  transitionStatus: TransitionStatus
  instant: string | undefined
  nested: boolean
}

/** Props for {@link MenuPopup}. */
export type MenuPopupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Element to focus when the menu closes.
   * - `false`: do not restore focus
   * - `true` / omitted / `null`: restore to trigger
   * - `HTMLElement`: focus that element
   */
  finalFocus?: boolean | HTMLElement | null
  render?: RenderProp<MenuPopupState, Record<string, unknown>>
}
