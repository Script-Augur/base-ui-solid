import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { usePopoverRootContext } from '../root/PopoverRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A button that closes the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 *
 * @param componentProps - Close props.
 * @returns A Solid JSX element.
 */
export function PopoverClose(componentProps: PopoverCloseProps): JSX.Element {
  const context = usePopoverRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'ref',
  ])

  const disabled = () => local.disabled ?? false

  createEffect(() => {
    context.registerClosePart()
    onCleanup(() => context.unregisterClosePart())
  })

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  const state: PopoverCloseState = {
    get disabled() {
      return disabled()
    },
  }

  return createRender<PopoverCloseState, Record<string, unknown>>({
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

/** Public state for {@link PopoverClose}. */
export interface PopoverCloseState extends Record<string, unknown> {
  disabled: boolean
}

/** Props for {@link PopoverClose}. */
export type PopoverCloseProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  render?: RenderProp<PopoverCloseState, Record<string, unknown>>
}
