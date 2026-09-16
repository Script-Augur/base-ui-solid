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
import { useDialogRootContext } from '../root/DialogRootContext'
import { FocusGuard } from '../utils/FocusGuard'
import { getNextTabbable } from '../utils/getNextTabbable'
import { InternalBackdrop } from '../utils/InternalBackdrop'
import { visuallyHiddenStyle } from '../utils/visuallyHidden'

import { DialogPortalContext } from './DialogPortalContext'

import type { PortalContainerProp } from '../../portal/resolvePortalContainer'
import type { JSX } from 'solid-js'
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Portal props (`keepMounted`, `container`, …).
 * @returns Portaled children when mounted (or keepMounted).
 */
export function DialogPortal(componentProps: DialogPortalProps): JSX.Element {
  const [local, portalProps] = splitProps(componentProps, [
    'children',
    'keepMounted',
    'container',
  ])

  const context = useDialogRootContext()
  const keepMounted = () => local.keepMounted ?? false
  const shouldRender = () => context.mounted() || keepMounted()

  const shouldRenderGuards = () =>
    context.mounted() && context.open() && context.modal() === false

  return (
    <Show when={shouldRender()}>
      <DialogPortalContext.Provider value={keepMounted()}>
        <Show when={shouldRenderGuards()}>
          <FocusGuard
            data-type="outside"
            onFocus={() => {
              // Lite: always move into the popup (upstream may use prev-tabbable
              // / inside-guard paths — see UPSTREAM_TEST_PARITY.md).
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
          <DialogPortalFocusPublisher />
          <Show when={context.mounted() && context.modal() === true}>
            <InternalBackdrop
              inert={!context.open() ? true : undefined}
              ref={el => {
                context.internalBackdropElementAssign(el)
                onCleanup(() =>
                  context.internalBackdropElementAssign(prev =>
                    prev === el ? null : prev
                  )
                )
              }}
            />
          </Show>
          {local.children}
        </Portal>

        <Show when={shouldRenderGuards()}>
          <FocusGuard
            data-type="outside"
            onFocus={event => {
              // Tabbing past the portal: continue page order (next tabbable
              // after this guard), then optionally close — matches FloatingPortal
              // after-guard intent (next after reference / portal edge).
              const from =
                (event.currentTarget as HTMLElement | null) ??
                context.triggerElement()
              const nextTabbable = getNextTabbable(from)
              nextTabbable?.focus()
              if (!context.disablePointerDismissal()) {
                context.setOpen(
                  false,
                  createChangeEventDetails(
                    REASONS.focusOut,
                    event as unknown as Event
                  )
                )
              }
            }}
          />
        </Show>
      </DialogPortalContext.Provider>
    </Show>
  )
}
/** Props for {@link DialogPortal}. */
export type DialogPortalProps = {
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
function DialogPortalFocusPublisher(): null {
  const context = useDialogRootContext()
  const portalContext = usePortalContext()
  const [published, publishedAssign] = createSignal(false)

  createEffect(() => {
    if (!portalContext) return
    const modal = context.modal() !== false
    portalContext.focusManagerStateAssign({
      modal,
      open: context.open(),
      onOpenChange: (next, data) => {
        context.setOpen(
          next,
          createChangeEventDetails(REASONS.focusOut, data?.event)
        )
      },
      domReference: context.triggerElement(),
      closeOnFocusOut: !context.disablePointerDismissal(),
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
