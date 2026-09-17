import { mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useDialogRootContext } from '../root/DialogRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A button that closes the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Close props.
 * @returns A Solid JSX element.
 */
export function DialogClose(componentProps: DialogCloseProps): JSX.Element {
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

  const state: DialogCloseState = {
    get disabled() {
      return disabled()
    },
  }

  return createRender<DialogCloseState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          onClick(event: MouseEvent) {
            if (disabled() || !context.open()) return
            context.setOpen(
              false,
              createChangeEventDetails(REASONS.closePress, event)
            )
          },
        }) as Record<string, unknown>
      ),
      {
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        ref(element: HTMLElement) {
          buttonRefAssign(element)
          const userRef = local.ref
          if (typeof userRef === 'function') {
            userRef(element as HTMLButtonElement)
          }
        },
      }
    ),
  })
}

/** Public state for {@link DialogClose}. */
export interface DialogCloseState extends Record<string, unknown> {
  disabled: boolean
}

/** Props for {@link DialogClose}. */
export type DialogCloseProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  render?: RenderProp<DialogCloseState, Record<string, unknown>>
}
