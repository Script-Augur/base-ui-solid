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
 * A description that describes the toast.
 * Can be used as the default message when no title is provided.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Description props.
 * @returns A Solid JSX element when content is renderable.
 */
export function ToastDescription(
  componentProps: ToastDescriptionProps
): JSX.Element {
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
    () => local.children ?? root.toast().description
  )
  const shouldRender = createMemo(() =>
    hasRenderableChildren(resolvedChildren())
  )

  createEffect(() => {
    if (!shouldRender()) {
      return
    }
    const nextId = id()
    root.descriptionIdAssign(nextId)
    onCleanup(() => {
      if (root.descriptionId() === nextId) {
        root.descriptionIdAssign(undefined)
      }
    })
  })

  const state: ToastDescriptionState = {
    get type() {
      return root.toast().type
    },
  }

  return (
    <Show when={shouldRender()}>
      {createRender<ToastDescriptionState, Record<string, unknown>>({
        defaultElement: 'p',
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
/** Public state for {@link ToastDescription}. */
export interface ToastDescriptionState extends Record<string, unknown> {
  type: string | undefined
}
/** Props for {@link ToastDescription}. */
export type ToastDescriptionProps = JSX.HTMLAttributes<HTMLParagraphElement> & {
  render?: RenderProp<ToastDescriptionState, Record<string, unknown>>
}
