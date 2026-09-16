import { generateId } from '@script-augur/base-ui-utils'
import {
  createEffect,
  createMemo,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useDialogRootContext } from '../root/DialogRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A paragraph with additional information about the dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Description props.
 * @returns A Solid JSX element.
 */
export function DialogDescription(
  componentProps: DialogDescriptionProps
): JSX.Element {
  const context = useDialogRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'children',
    'ref',
  ])

  const id = createMemo(
    () => local.id ?? generateId('base-ui-dialog-description')
  )

  createEffect(() => {
    const nextId = id()
    context.descriptionElementIdAssign(nextId)
    onCleanup(() => {
      context.descriptionElementIdAssign(prev =>
        prev === nextId ? undefined : prev
      )
    })
  })

  return createRender<DialogDescriptionState, Record<string, unknown>>({
    defaultElement: 'p',
    state: {},
    render: local.render,
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
      children: local.children,
      ref: local.ref,
    }),
  })
}

/** Public state for {@link DialogDescription}. */
export interface DialogDescriptionState extends Record<string, unknown> {}

/** Props for {@link DialogDescription}. */
export type DialogDescriptionProps =
  JSX.HTMLAttributes<HTMLParagraphElement> & {
    render?: RenderProp<DialogDescriptionState, Record<string, unknown>>
  }
