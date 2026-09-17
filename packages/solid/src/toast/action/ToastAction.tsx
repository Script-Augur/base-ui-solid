import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useToastRootContext } from '../root/ToastRootContext'
import { hasRenderableChildren } from '../utils/isRenderableNode'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Performs an action when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Action props.
 * @returns A Solid JSX element when children are renderable.
 */
export function ToastAction(componentProps: ToastActionProps): JSX.Element {
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

  const disabled = () => local.disabled ?? false

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  const computedChildren = () =>
    root.toast().actionProps?.children ?? local.children

  const state: ToastActionState = {
    get type() {
      return root.toast().type
    },
  }

  return (
    <Show when={hasRenderableChildren(computedChildren())}>
      {createRender<ToastActionState, Record<string, unknown>>({
        defaultElement: 'button',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        props: mergeProps(
          getButtonProps(
            mergeProps(
              elementProps as Record<string, unknown>,
              (root.toast().actionProps ?? {}) as Record<string, unknown>,
              {
                get children() {
                  return computedChildren()
                },
              }
            ) as Record<string, unknown>
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
      })}
    </Show>
  )
}
/** Public state for {@link ToastAction}. */
export interface ToastActionState extends Record<string, unknown> {
  type: string | undefined
}
/** Props for {@link ToastAction}. */
export type ToastActionProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  render?: RenderProp<ToastActionState, Record<string, unknown>>
}
