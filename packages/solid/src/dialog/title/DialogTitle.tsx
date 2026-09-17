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
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Title props.
 * @returns A Solid JSX element.
 */
export function DialogTitle(componentProps: DialogTitleProps): JSX.Element {
  const context = useDialogRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'children',
    'ref',
  ])

  const id = createMemo(() => local.id ?? generateId('base-ui-dialog-title'))

  createEffect(() => {
    const nextId = id()
    context.titleElementIdAssign(nextId)
    onCleanup(() => {
      context.titleElementIdAssign(prev => (prev === nextId ? undefined : prev))
    })
  })

  return createRender<DialogTitleState, Record<string, unknown>>({
    defaultElement: 'h2',
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

/** Public state for {@link DialogTitle}. */
export interface DialogTitleState extends Record<string, unknown> {}

/** Props for {@link DialogTitle}. */
export type DialogTitleProps = JSX.HTMLAttributes<HTMLHeadingElement> & {
  render?: RenderProp<DialogTitleState, Record<string, unknown>>
}
