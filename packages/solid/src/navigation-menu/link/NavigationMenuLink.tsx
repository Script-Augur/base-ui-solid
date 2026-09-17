import { splitProps } from 'solid-js'

import { CompositeItem } from '../../internals/composite/item/CompositeItem'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A link in the navigation menu.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Link props (`active`, `closeOnClick`, …).
 * @returns A Solid JSX element.
 */
export function NavigationMenuLink(
  componentProps: NavigationMenuLinkProps
): JSX.Element {
  const context = useNavigationMenuRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'active',
    'closeOnClick',
  ])

  const active = () => local.active ?? false
  const closeOnClick = () => local.closeOnClick ?? false

  const state: NavigationMenuLinkState = {
    get active() {
      return active()
    },
  }

  return (
    <CompositeItem
      tag="a"
      render={local.render}
      class={local.class}
      style={local.style}
      state={state}
      props={[
        {
          get 'aria-current'() {
            return active() ? ('page' as const) : undefined
          },
          tabIndex: undefined,
          onClick(event: MouseEvent) {
            if (closeOnClick()) {
              context.setValue(
                null,
                createChangeEventDetails(REASONS.linkPress, event)
              )
            }
          },
          onBlur(event: FocusEvent) {
            if (
              isOutsideMenuEvent(
                {
                  currentTarget: event.currentTarget as HTMLElement | null,
                  relatedTarget: event.relatedTarget as HTMLElement | null,
                },
                {
                  popupElement: context.popupElement(),
                  rootElement: context.rootElement(),
                }
              )
            ) {
              context.setValue(
                null,
                createChangeEventDetails(REASONS.focusOut, event)
              )
            }
          },
        },
        elementProps,
      ]}
      refs={[
        el => {
          const userRef = local.ref
          if (typeof userRef === 'function') {
            userRef(el as HTMLAnchorElement)
          }
        },
      ]}
    >
      {local.children}
    </CompositeItem>
  )
}

/** Public state for {@link NavigationMenuLink}. */
export interface NavigationMenuLinkState extends Record<string, unknown> {
  active: boolean
}

/** Props for {@link NavigationMenuLink}. */
export type NavigationMenuLinkProps =
  JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {
    /**
     * Whether the link is the currently active page.
     * @default false
     */
    active?: boolean
    /**
     * Whether to close the navigation menu when the link is clicked.
     * @default false
     */
    closeOnClick?: boolean
    render?: RenderProp<NavigationMenuLinkState, Record<string, unknown>>
  }
