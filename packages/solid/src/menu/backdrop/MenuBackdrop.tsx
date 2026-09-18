import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useMenuRootContext } from '../root/MenuRootContext'
import { popupTransitionStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuBackdrop(componentProps: MenuBackdropProps): JSX.Element {
  const context = useMenuRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: MenuBackdropState = {
    get open() {
      return context.open()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
  }

  return createRender<MenuBackdropState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: popupTransitionStateMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      role: 'presentation',
      get ['attr:hidden']() {
        return context.mounted() ? undefined : true
      },
      get class() {
        return local.class
      },
      get style() {
        const base: JSX.CSSProperties = {
          'user-select': 'none',
          '-webkit-user-select': 'none',
        }
        const user = local.style
        if (user && typeof user === 'object' && !Array.isArray(user)) {
          return { ...base, ...user }
        }
        return base
      },
      ref(element: HTMLElement) {
        context.backdropElementAssign(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}

/** Public state for {@link MenuBackdrop}. */
export interface MenuBackdropState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link MenuBackdrop}. */
export type MenuBackdropProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<MenuBackdropState, Record<string, unknown>>
}
