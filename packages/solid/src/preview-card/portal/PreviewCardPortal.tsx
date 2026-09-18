import {
  Show,
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { Portal } from '../../portal/Portal'
import { usePortalContext } from '../../portal/PortalContext'
import { usePreviewCardRootContext } from '../root/PreviewCardRootContext'
import { FocusGuard } from '../utils/FocusGuard'
import { getNextTabbable } from '../utils/getNextTabbable'
import { visuallyHiddenStyle } from '../utils/visuallyHidden'

import { PreviewCardPortalContext } from './PreviewCardPortalContext'

import type { PortalContainerProp } from '../../portal/resolvePortalContainer'
import type { JSX } from 'solid-js'

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 *
 * @param componentProps - Portal props (`keepMounted`, `container`, …).
 * @returns Portaled children when mounted (or keepMounted).
 */
export function PreviewCardPortal(
  componentProps: PreviewCardPortalProps
): JSX.Element {
  const [local, portalProps] = splitProps(componentProps, [
    'children',
    'keepMounted',
    'container',
  ])

  const context = usePreviewCardRootContext()
  const keepMounted = () => local.keepMounted ?? false
  const shouldRender = () => context.mounted() || keepMounted()

  const shouldRenderGuards = () => context.mounted() && context.open()

  return (
    <Show when={shouldRender()}>
      <PreviewCardPortalContext.Provider value={keepMounted()}>
        <Show when={shouldRenderGuards()}>
          <FocusGuard
            data-type="outside"
            onFocus={() => {
              const popup = context.popupElement()
              popup?.focus()
            }}
          />

          <span aria-owns={context.portalId()} style={visuallyHiddenStyle} />
        </Show>

        <Portal
          {...portalProps}
          id={context.portalId()}
          container={local.container}
        >
          <PreviewCardPortalFocusPublisher />
          {local.children}
        </Portal>

        <Show when={shouldRenderGuards()}>
          <FocusGuard
            data-type="outside"
            onFocus={event => {
              const from =
                (event.currentTarget as HTMLElement | null) ??
                context.triggerElement()
              const nextTabbable = getNextTabbable(from)
              nextTabbable?.focus()
              context.setOpen(
                false,
                createChangeEventDetails(
                  REASONS.focusOut,
                  event as unknown as Event
                )
              )
            }}
          />
        </Show>
      </PreviewCardPortalContext.Provider>
    </Show>
  )
}

/** Props for {@link PreviewCardPortal}. */
export type PreviewCardPortalProps = {
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

/**
 * Publishes focus-manager state into Portal context for overlay consumers.
 */
function PreviewCardPortalFocusPublisher(): null {
  const context = usePreviewCardRootContext()
  const portalContext = usePortalContext()
  const [published, publishedAssign] = createSignal(false)

  createEffect(() => {
    if (!portalContext) return
    portalContext.focusManagerStateAssign({
      modal: false,
      open: context.open(),
      onOpenChange: (next, data) => {
        context.setOpen(
          next,
          createChangeEventDetails(REASONS.focusOut, data?.event)
        )
      },
      domReference: context.triggerElement(),
      closeOnFocusOut: true,
    })
    publishedAssign(true)
    onCleanup(() => {
      if (published()) {
        portalContext.focusManagerStateAssign(null)
      }
    })
  })

  return null
}
