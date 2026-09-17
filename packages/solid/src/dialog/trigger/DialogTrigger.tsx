import { mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useDialogRootContext } from '../root/DialogRootContext'
import { triggerOpenStateMapping } from '../utils/stateAttributesMapping'

import { DialogTriggerDataAttributes } from './DialogTriggerDataAttributes'

import type { RenderProp } from '../../internals/createRender'
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
  const context = useDialogRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'ref',
  ])

  const disabled = () => local.disabled ?? false

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  const state: DialogTriggerState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return context.open()
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
            const next = !context.open()
            context.setOpen(
              next,
              createChangeEventDetails(REASONS.triggerPress, event)
            )
          },
        }) as Record<string, unknown>
      ),
      {
        get 'aria-haspopup'() {
          return 'dialog' as const
        },
        get 'aria-expanded'() {
          return context.open()
        },
        get 'aria-controls'() {
          return context.open()
            ? (context.popupElement()?.id ?? undefined)
            : undefined
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get [DialogTriggerDataAttributes.popupOpen]() {
          return context.open() ? '' : undefined
        },
        ref(element: HTMLElement) {
          buttonRefAssign(element)
          context.triggerElementAssign(element)
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
}
