import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'
import { popupTransitionStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * A backdrop for the navigation menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Backdrop props.
 * @returns A Solid JSX element.
 */
export function NavigationMenuBackdrop(
  componentProps: NavigationMenuBackdropProps
): JSX.Element {
  const context = useNavigationMenuRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: NavigationMenuBackdropState = {
    get open() {
      return context.open()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
  }

  return createRender<NavigationMenuBackdropState, Record<string, unknown>>({
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
      ref: local.ref,
    }),
  })
}

/** Public state for {@link NavigationMenuBackdrop}. */
export interface NavigationMenuBackdropState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link NavigationMenuBackdrop}. */
export type NavigationMenuBackdropProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<NavigationMenuBackdropState, Record<string, unknown>>
}
