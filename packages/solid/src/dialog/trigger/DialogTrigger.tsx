import { generateId } from '@script-augur/base-ui-utils'
import { createSignal, mergeProps, splitProps } from 'solid-js'

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
import { useDialogRootContext } from '../root/DialogRootContext'
import { triggerOpenStateMapping } from '../utils/stateAttributesMapping'

import { DialogTriggerDataAttributes } from './DialogTriggerDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { DialogHandle } from '../store/DialogHandle'
import type { JSX } from 'solid-js'

/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function DialogTrigger(componentProps: DialogTriggerProps): JSX.Element {
  const dialogRootContext = useDialogRootContext(true)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
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
      dialogRootContext?.store)

  if (!store()) {
    throw new Error(
      'Base UI: <Dialog.Trigger> must be used within <Dialog.Root> or provided with a handle.'
    )
  }

  const triggerId = local.id ?? generateId('base-ui-dialog-trigger')
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

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  const isOpenedByThisTrigger = () =>
    store()!.select('isOpenedByTrigger', triggerId)
  const popupId = () => store()!.select('triggerPopupId', triggerId)

  const state: DialogTriggerState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return isOpenedByThisTrigger()
    },
  }

  return createRender<DialogTriggerState, Record<string, unknown>>({
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
            const next = !activeStore.select('open')
            activeStore.setOpen(
              next,
              createChangeEventDetails(
                REASONS.triggerPress,
                event,
                triggerElement() ?? undefined
              )
            )
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
        get [DialogTriggerDataAttributes.popupOpen]() {
          return isOpenedByThisTrigger() ? '' : undefined
        },
        ref(element: HTMLElement) {
          buttonRefAssign(element)
          triggerElementAssign(element)
          registerTrigger(element)
          // Keep legacy single-trigger element for focus restore when nested in Root.
          if (isMountedByThisTrigger() || dialogRootContext) {
            dialogRootContext?.triggerElementAssign(element)
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

/** Public state for {@link DialogTrigger}. */
export interface DialogTriggerState extends Record<string, unknown> {
  disabled: boolean
  open: boolean
}

/** Props for {@link DialogTrigger}. */
export type DialogTriggerProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  render?: RenderProp<DialogTriggerState, Record<string, unknown>>
  /**
   * A handle to associate this trigger with a dialog root rendered elsewhere.
   */
  handle?: DialogHandle<unknown>
  /**
   * Payload associated with this trigger. Stored on the popup store when this
   * trigger opens the dialog; exposed to root render-prop children as `{ payload }`.
   */
  payload?: unknown
}
