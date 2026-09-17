import { contains, getTarget } from '@script-augur/base-ui-utils'
import { splitProps } from 'solid-js'

import { CompositeRoot } from '../../internals/composite/root/CompositeRoot'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createDismiss } from '../../internals/dismiss'
import { listenerEffect } from '../../internals/listenerEffect'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'
import { NAVIGATION_MENU_TRIGGER_IDENTIFIER } from '../utils/constants'

import { NavigationMenuDismissContext } from './NavigationMenuDismissContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Contains a list of navigation menu items.
 * Renders a `<ul>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - List props.
 * @returns A Solid JSX element.
 */
export function NavigationMenuList(
  componentProps: NavigationMenuListProps
): JSX.Element {
  const context = useNavigationMenuRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const nested = () => context.nested()

  createDismiss({
    enabled: () => context.open() && context.mounted(),
    refs: () => [
      context.popupElement(),
      context.positionerElement(),
      context.viewportElement(),
      context.rootElement(),
    ],
    onDismiss: event => {
      context.setValue(null, createChangeEventDetails(REASONS.escapeKey, event))
    },
    escapeKey: true,
    outsidePress: false,
  })

  // Outside press: ignore presses on Navigation Menu triggers (they toggle).
  listenerEffect(
    () => {
      if (!context.open() || !context.mounted()) return null
      return document
    },
    'pointerdown',
    event => {
      if ('button' in event && event.button !== 0) return
      const target = getTarget(event) as Element | null
      if (!target) return

      if (target.closest(`[${NAVIGATION_MENU_TRIGGER_IDENTIFIER}]`) != null) {
        return
      }

      const popup = context.popupElement()
      if (popup && contains(popup, target)) return
      const positioner = context.positionerElement()
      if (positioner && contains(positioner, target)) return
      const viewport = context.viewportElement()
      if (viewport && contains(viewport, target)) return
      const root = context.rootElement()
      if (root && contains(root, target)) return

      context.setValue(
        null,
        createChangeEventDetails(REASONS.outsidePress, event)
      )
    },
    true
  )

  const state: NavigationMenuListState = {
    get open() {
      return context.open()
    },
  }

  const dismissContext = {
    enabled: () => context.open(),
  }

  const keyGuardProps = nested()
    ? {}
    : {
        onKeyDown(event: KeyboardEvent) {
          const orientation = context.orientation()
          const shouldStop =
            (orientation === 'horizontal' &&
              (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) ||
            (orientation === 'vertical' &&
              (event.key === 'ArrowUp' || event.key === 'ArrowDown'))
          if (shouldStop) {
            event.stopPropagation()
          }
        },
      }

  return (
    <NavigationMenuDismissContext.Provider value={dismissContext}>
      {nested() ? (
        // Nested: skip CompositeRoot so parent Content owns navigation.
        <ul
          class={local.class}
          style={local.style}
          ref={el => {
            const userRef = local.ref
            if (typeof userRef === 'function') userRef(el)
          }}
          {...elementProps}
          {...keyGuardProps}
        >
          {local.children}
        </ul>
      ) : (
        <CompositeRoot
          tag="ul"
          render={local.render}
          class={local.class}
          style={local.style}
          state={state}
          loopFocus={false}
          orientation={context.orientation()}
          props={[keyGuardProps, elementProps]}
          refs={[
            el => {
              const userRef = local.ref
              if (typeof userRef === 'function') {
                userRef(el as HTMLUListElement)
              }
            },
          ]}
        >
          {local.children}
        </CompositeRoot>
      )}
    </NavigationMenuDismissContext.Provider>
  )
}

/** Public state for {@link NavigationMenuList}. */
export interface NavigationMenuListState extends Record<string, unknown> {
  open: boolean
}

/** Props for {@link NavigationMenuList}. */
export type NavigationMenuListProps = JSX.HTMLAttributes<HTMLUListElement> & {
  render?: RenderProp<NavigationMenuListState, Record<string, unknown>>
}
