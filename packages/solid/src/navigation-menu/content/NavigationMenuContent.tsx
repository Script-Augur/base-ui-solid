import { contains } from '@script-augur/base-ui-utils'
import {
  Show,
  createEffect,
  createSignal,
  mergeProps,
  splitProps,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { CompositeRoot } from '../../internals/composite/root/CompositeRoot'
import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'
import { contentStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { NavigationMenuActivationDirection } from '../root/NavigationMenuRootContext'
import type { JSX } from 'solid-js'

/**
 * Content for a navigation menu item, portaled into the Viewport when active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Content props (`keepMounted`, …).
 * @returns A Solid JSX element.
 */
export function NavigationMenuContent(
  componentProps: NavigationMenuContentProps
): JSX.Element {
  const root = useNavigationMenuRootContext()
  const item = useNavigationMenuItemContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'keepMounted',
  ])

  const keepMounted = () => local.keepMounted ?? false
  const itemOpen = () => root.mounted() && root.value() === item.value()

  const { mounted, mountedAssign, transitionStatus } =
    createTransitionStatus(itemOpen)

  const [focusInside, focusInsideAssign] = createSignal(false)
  const [contentEl, contentElAssign] = createSignal<HTMLElement | null>(null)

  createEffect(() => {
    if (mounted() && !root.mounted()) {
      mountedAssign(false)
    }
  })

  createOpenChangeComplete({
    open: itemOpen,
    element: contentEl,
    onComplete() {
      if (!itemOpen()) {
        mountedAssign(false)
      }
    },
  })

  createEffect(() => {
    if (itemOpen() && contentEl()) {
      root.currentContentElementAssign(contentEl())
    }
  })

  const state: NavigationMenuContentState = {
    get open() {
      return itemOpen()
    },
    get transitionStatus() {
      return transitionStatus()
    },
    get activationDirection() {
      return root.activationDirection()
    },
  }

  const portalContainer = () => root.viewportElement()
  const shouldRender = () => {
    if (keepMounted()) {
      return portalContainer() != null || mounted()
    }
    return portalContainer() != null && mounted()
  }

  const contentProps = mergeProps(elementProps as Record<string, unknown>, {
    get style() {
      const base: JSX.CSSProperties =
        !itemOpen() && mounted()
          ? { position: 'absolute', top: '0', left: '0' }
          : {}
      const user = local.style
      if (user && typeof user === 'object' && !Array.isArray(user)) {
        return { ...base, ...user }
      }
      return Object.keys(base).length ? base : local.style
    },
    get inert() {
      return !itemOpen() && mounted() ? !focusInside() : undefined
    },
    get hidden() {
      return keepMounted() && !mounted() ? true : undefined
    },
    onFocus() {
      focusInsideAssign(true)
    },
    onBlur(event: FocusEvent) {
      if (
        !contains(
          event.currentTarget as Element,
          event.relatedTarget as Element | null
        )
      ) {
        focusInsideAssign(false)
      }
    },
    get class() {
      return local.class
    },
    children: local.children,
  })

  return (
    <Show when={shouldRender()}>
      <Show
        when={portalContainer()}
        fallback={
          keepMounted() ? (
            <CompositeRoot
              tag="div"
              render={local.render}
              state={state}
              stateAttributesMapping={contentStateAttributesMapping}
              props={[contentProps, { hidden: true }]}
              refs={[
                el => {
                  contentElAssign(el)
                  const userRef = local.ref
                  if (typeof userRef === 'function') {
                    userRef(el as HTMLDivElement)
                  }
                },
              ]}
            />
          ) : null
        }
      >
        <Portal mount={portalContainer()!}>
          <CompositeRoot
            tag="div"
            render={local.render}
            state={state}
            stateAttributesMapping={contentStateAttributesMapping}
            props={[contentProps]}
            refs={[
              el => {
                contentElAssign(el)
                if (itemOpen() && el) {
                  root.currentContentElementAssign(el)
                }
                const userRef = local.ref
                if (typeof userRef === 'function') {
                  userRef(el as HTMLDivElement)
                }
              },
            ]}
          />
        </Portal>
      </Show>
    </Show>
  )
}

/** Public state for {@link NavigationMenuContent}. */
export interface NavigationMenuContentState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
  activationDirection: NavigationMenuActivationDirection
}

/** Props for {@link NavigationMenuContent}. */
export type NavigationMenuContentProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Whether to keep the content mounted while inactive.
   * @default false
   */
  keepMounted?: boolean
  render?: RenderProp<NavigationMenuContentState, Record<string, unknown>>
}
