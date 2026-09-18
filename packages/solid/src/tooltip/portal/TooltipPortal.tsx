import { Show, splitProps } from 'solid-js'

import { Portal } from '../../portal/Portal'
import { useTooltipRootContext } from '../root/TooltipRootContext'

import { TooltipPortalContext } from './TooltipPortalContext'

import type { PortalContainerProp } from '../../portal/resolvePortalContainer'
import type { JSX } from 'solid-js'

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Unlike `Popover.Portal` / `Dialog.Portal`, tooltips never trap or steal
 * focus, so there are no focus guards or an internal backdrop here.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 *
 * @param componentProps - Portal props (`keepMounted`, `container`, …).
 * @returns Portaled children when mounted (or keepMounted).
 */
export function TooltipPortal(componentProps: TooltipPortalProps): JSX.Element {
  const [local, portalProps] = splitProps(componentProps, [
    'children',
    'keepMounted',
    'container',
  ])

  const context = useTooltipRootContext()
  const keepMounted = () => local.keepMounted ?? false
  const shouldRender = () => context.mounted() || keepMounted()

  return (
    <Show when={shouldRender()}>
      <TooltipPortalContext.Provider value={keepMounted()}>
        <Portal
          {...portalProps}
          id={context.portalId()}
          container={local.container}
        >
          {local.children}
        </Portal>
      </TooltipPortalContext.Provider>
    </Show>
  )
}

/** Props for {@link TooltipPortal}. */
export type TooltipPortalProps = {
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
