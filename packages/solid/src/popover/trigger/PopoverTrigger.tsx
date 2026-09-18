import { generateId } from '@script-augur/base-ui-utils'
import {
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import {
  createPopupHandleStore,
  createTriggerDataForwarding,
} from '../../internals/popups'
import { useButton } from '../../internals/useButton'
import { usePopoverRootContext } from '../root/PopoverRootContext'
import { OPEN_DELAY } from '../utils/constants'
import { triggerOpenStateMapping } from '../utils/stateAttributesMapping'

import { PopoverTriggerDataAttributes } from './PopoverTriggerDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { PopoverHandle } from '../store/PopoverHandle'
import type { JSX } from 'solid-js'

/**
 * A button that opens the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function PopoverTrigger(
  componentProps: PopoverTriggerProps
): JSX.Element {
  const popoverRootContext = usePopoverRootContext(true)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'openOnHover',
    'delay',
    'closeDelay',
    'ref',
    'id',
    'payload',
    'handle',
  ])

  const handleStore = createPopupHandleStore(
    local.handle
  )
  const store = () =>
    (handleStore() ??
      popoverRootContext?.store)

  if (!store()) {
    throw new Error(
      'Base UI: <Popover.Trigger> must be used within <Popover.Root> or provided with a handle.'
    )
  }

  const triggerId = local.id ?? generateId('base-ui-popover-trigger')
  const [triggerElement, triggerElementAssign] =
    createSignal<HTMLElement | null>(null)

  const { registerTrigger, isMountedByThisTrigger } =
    createTriggerDataForwarding(
      () => triggerId,
      triggerElement,
      () => store()!,
      () => ({ payload: local.payload })
    )

  const disabled = () => local.disabled ?? false

  createEffect(() => {
    if (!popoverRootContext) return
    popoverRootContext.openOnHoverAssign(local.openOnHover ?? false)
    popoverRootContext.hoverDelayAssign(local.delay ?? OPEN_DELAY)
    popoverRootContext.hoverCloseDelayAssign(local.closeDelay ?? 0)
  })

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  let openTimeout: ReturnType<typeof setTimeout> | undefined
  let closeTimeout: ReturnType<typeof setTimeout> | undefined

  const clearHoverTimers = () => {
    if (openTimeout) {
      clearTimeout(openTimeout)
      openTimeout = undefined
    }
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      closeTimeout = undefined
    }
  }

  onCleanup(clearHoverTimers)

  const isOpenedByThisTrigger = () =>
    store()!.select('isOpenedByTrigger', triggerId)
  const popupId = () => store()!.select('triggerPopupId', triggerId)
  const isOpen = () => store()!.select('open')

  const state: PopoverTriggerState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return isOpenedByThisTrigger()
    },
  }

  return createRender<PopoverTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: triggerOpenStateMapping,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          onClick(event: MouseEvent) {
            if (disabled()) return
            const activeStore = store()!
            const stickIfOpen =
              popoverRootContext?.stickIfOpen() ??
              activeStore.select('stickIfOpen')
            const openChangeReason =
              popoverRootContext?.openChangeReason() ??
              activeStore.select('openChangeReason')
            // Match Floating UI useClick: stickIfOpen only blocks close when
            // the popup was opened by a non-click event (hover). Click-open
            // must still toggle closed on a second trigger press.
            if (
              isOpen() &&
              stickIfOpen &&
              openChangeReason === REASONS.triggerHover
            ) {
              return
            }
            const next = !isOpen()
            activeStore.setOpen(
              next,
              createChangeEventDetails(
                REASONS.triggerPress,
                event,
                triggerElement() ?? undefined
              )
            )
          },
          onPointerEnter(event: PointerEvent) {
            if (disabled() || !(local.openOnHover ?? false)) return
            if (event.pointerType === 'touch') return
            clearHoverTimers()
            openTimeout = setTimeout(() => {
              if (!isOpen()) {
                store()!.setOpen(
                  true,
                  createChangeEventDetails(
                    REASONS.triggerHover,
                    event,
                    triggerElement() ?? undefined
                  )
                )
              }
            }, local.delay ?? OPEN_DELAY)
          },
          onPointerLeave(event: PointerEvent) {
            if (disabled() || !(local.openOnHover ?? false)) return
            if (event.pointerType === 'touch') return
            clearHoverTimers()
            closeTimeout = setTimeout(() => {
              const openChangeReason =
                popoverRootContext?.openChangeReason() ??
                store()!.select('openChangeReason')
              if (isOpen() && openChangeReason === REASONS.triggerHover) {
                store()!.setOpen(
                  false,
                  createChangeEventDetails(
                    REASONS.triggerHover,
                    event,
                    triggerElement() ?? undefined
                  )
                )
              }
            }, local.closeDelay ?? 0)
          },
        }) as Record<string, unknown>
      ),
      {
        get id() {
          return triggerId
        },
        get 'aria-haspopup'() {
          return 'dialog' as const
        },
        get 'aria-expanded'() {
          return isOpenedByThisTrigger()
        },
        get 'aria-controls'() {
          return popupId()
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get [PopoverTriggerDataAttributes.popupOpen]() {
          return isOpenedByThisTrigger() ? '' : undefined
        },
        ref(element: HTMLElement) {
          buttonRefAssign(element)
          triggerElementAssign(element)
          registerTrigger(element)
          if (isMountedByThisTrigger() || popoverRootContext) {
            popoverRootContext?.triggerElementAssign(element)
          }
          const userRef = local.ref
          if (typeof userRef === 'function') {
            userRef(element as HTMLButtonElement)
          }
        },
      }
    ),
  })
}

/** Public state for {@link PopoverTrigger}. */
export interface PopoverTriggerState extends Record<string, unknown> {
  disabled: boolean
  open: boolean
}

/** Props for {@link PopoverTrigger}. */
export type PopoverTriggerProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  /**
   * Whether the popover opens on hover.
   * @default false
   */
  openOnHover?: boolean
  /**
   * How long to wait before opening after hover, in ms.
   * @default 300
   */
  delay?: number
  /**
   * How long to wait before closing after hover out, in ms.
   * @default 0
   */
  closeDelay?: number
  /**
   * A handle to associate this trigger with a popover root rendered elsewhere.
   */
  handle?: PopoverHandle<unknown>
  /**
   * Payload associated with this trigger. Stored on the popup store when this
   * trigger opens the popover; exposed to root render-prop children as `{ payload }`.
   */
  payload?: unknown
  render?: RenderProp<PopoverTriggerState, Record<string, unknown>>
}
