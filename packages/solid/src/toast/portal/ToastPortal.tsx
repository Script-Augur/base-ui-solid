import { splitProps } from 'solid-js'

import { Portal } from '../../portal/Portal'

import type { PortalContainerProp } from '../../portal/resolvePortalContainer'
import type { JSX } from 'solid-js'

/**
 * A portal element that moves the viewport to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Portal props.
 * @returns Portaled children.
 */
export function ToastPortal(componentProps: ToastPortalProps): JSX.Element {
  const [local, portalProps] = splitProps(componentProps, [
    'children',
    'container',
  ])

  return (
    <Portal {...portalProps} container={local.container}>
      {local.children}
    </Portal>
  )
}
/** Props for {@link ToastPortal}. */
export type ToastPortalProps = {
  children?: JSX.Element
  /**
   * A parent element to render the portal element into.
   */
  container?: PortalContainerProp
  class?: string
  style?: JSX.CSSProperties | string
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void)
}
