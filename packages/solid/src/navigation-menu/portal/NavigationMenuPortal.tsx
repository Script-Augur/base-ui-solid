import { Show, splitProps } from 'solid-js'

import { Portal } from '../../portal/Portal'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'

import { NavigationMenuPortalContext } from './NavigationMenuPortalContext'

import type { PortalContainerProp } from '../../portal/resolvePortalContainer'
import type { JSX } from 'solid-js'

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Portal props (`keepMounted`, `container`, …).
 * @returns Portaled children when mounted (or keepMounted).
 */
export function NavigationMenuPortal(
  componentProps: NavigationMenuPortalProps
): JSX.Element {
  const [local, portalProps] = splitProps(componentProps, [
    'children',
    'keepMounted',
    'container',
  ])

  const context = useNavigationMenuRootContext()
  const keepMounted = () => local.keepMounted ?? false
  const shouldRender = () => context.mounted() || keepMounted()

  return (
    <Show when={shouldRender()}>
      <NavigationMenuPortalContext.Provider value={keepMounted()}>
        <Portal {...portalProps} container={local.container}>
          {local.children}
        </Portal>
      </NavigationMenuPortalContext.Provider>
    </Show>
  )
}

/** Props for {@link NavigationMenuPortal}. */
export type NavigationMenuPortalProps = {
  children?: JSX.Element
  /**
   * Whether to keep the portal mounted while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean
  /** Parent element to render the portal into. */
  container?: PortalContainerProp
  class?: string
  style?: JSX.CSSProperties | string
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void)
}
