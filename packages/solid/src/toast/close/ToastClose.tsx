import { createSignal, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useToastProviderContext } from '../provider/ToastProviderContext'
import { useToastRootContext } from '../root/ToastRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Closes the toast when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Close props.
 * @returns A Solid JSX element.
 */
export function ToastClose(componentProps: ToastCloseProps): JSX.Element {
  const store = useToastProviderContext()
  const root = useToastRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'ref',
    'children',
  ])

  const [hasFocus, hasFocusAssign] = createSignal(false)
  const disabled = () => local.disabled ?? false

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  const state: ToastCloseState = {
    get type() {
      return root.toast().type
    },
  }

  return createRender<ToastCloseState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          get ['aria-hidden']() {
            return !root.expanded() && !hasFocus() ? true : undefined
          },
          onClick() {
            store.closeToast(root.toast().id)
          },
          onFocus() {
            hasFocusAssign(true)
          },
          onBlur() {
            hasFocusAssign(false)
          },
          get children() {
            return local.children
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
/** Public state for {@link ToastClose}. */
export interface ToastCloseState extends Record<string, unknown> {
  type: string | undefined
}
/** Props for {@link ToastClose}. */
export type ToastCloseProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  render?: RenderProp<ToastCloseState, Record<string, unknown>>
}
