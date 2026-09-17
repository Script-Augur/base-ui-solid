import {
  Show,
  createEffect,
  createMemo,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useToastRootContext } from '../root/ToastRootContext'
import { hasRenderableChildren } from '../utils/isRenderableNode'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Title props.
 * @returns A Solid JSX element when content is renderable.
 */
export function ToastTitle(componentProps: ToastTitleProps): JSX.Element {
  const root = useToastRootContext()
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'children',
    'ref',
  ])

  const generatedId = createUniqueId()
  const id = createMemo(() => local.id ?? generatedId)
  const resolvedChildren = createMemo(
    () => local.children ?? root.toast().title
  )
  const shouldRender = createMemo(() =>
    hasRenderableChildren(resolvedChildren())
  )

  createEffect(() => {
    if (!shouldRender()) {
      return
    }
    const nextId = id()
    root.titleIdAssign(nextId)
    onCleanup(() => {
      if (root.titleId() === nextId) {
        root.titleIdAssign(undefined)
      }
    })
  })

  const state: ToastTitleState = {
    get type() {
      return root.toast().type
    },
  }

  return (
    <Show when={shouldRender()}>
      {createRender<ToastTitleState, Record<string, unknown>>({
        defaultElement: 'h2',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get id() {
            return id()
          },
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get children() {
            return resolvedChildren()
          },
          ref: local.ref,
        }),
      })}
    </Show>
  )
}
/** Public state for {@link ToastTitle}. */
export interface ToastTitleState extends Record<string, unknown> {
  type: string | undefined
}
/** Props for {@link ToastTitle}. */
export type ToastTitleProps = JSX.HTMLAttributes<HTMLHeadingElement> & {
  render?: RenderProp<ToastTitleState, Record<string, unknown>>
}
