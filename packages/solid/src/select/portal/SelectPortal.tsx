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
import { useSelectRootContext } from '../root/SelectRootContext'
import { FocusGuard } from '../utils/FocusGuard'
import { getNextTabbable } from '../utils/getNextTabbable'
import { InternalBackdrop } from '../utils/InternalBackdrop'
import { visuallyHiddenStyle } from '../utils/visuallyHidden'

import { SelectPortalContext } from './SelectPortalContext'

import type { PortalContainerProp } from '../../portal/resolvePortalContainer'
import type { JSX } from 'solid-js'

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Portal props (`keepMounted`, `container`, …).
 * @returns Portaled children when mounted (or keepMounted).
 */
export function SelectPortal(componentProps: SelectPortalProps): JSX.Element {
  const [local, portalProps] = splitProps(componentProps, [
    'children',
    'keepMounted',
    'container',
  ])

  const context = useSelectRootContext()
  const keepMounted = () => local.keepMounted ?? false
  const shouldRender = () => context.mounted() || keepMounted()

  const shouldRenderGuards = () =>
    context.mounted() && context.open() && context.modal() === false

  return (
    <Show when={shouldRender()}>
      <SelectPortalContext.Provider value={keepMounted()}>
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
          <SelectPortalFocusPublisher />

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
      </SelectPortalContext.Provider>
    </Show>
  )
}

/** Props for {@link SelectPortal}. */
export type SelectPortalProps = {
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
function SelectPortalFocusPublisher(): null {
  const context = useSelectRootContext()
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
