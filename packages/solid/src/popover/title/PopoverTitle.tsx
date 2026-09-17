import { generateId } from '@script-augur/base-ui-utils'
import {
  createEffect,
  createMemo,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { usePopoverRootContext } from '../root/PopoverRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A heading that labels the popover.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 *
 * @param componentProps - Title props.
 * @returns A Solid JSX element.
 */
export function PopoverTitle(componentProps: PopoverTitleProps): JSX.Element {
  const context = usePopoverRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'children',
    'ref',
  ])

  const id = createMemo(() => local.id ?? generateId('base-ui-popover-title'))

  createEffect(() => {
    const nextId = id()
    context.titleElementIdAssign(nextId)
    onCleanup(() => {
      context.titleElementIdAssign(prev => (prev === nextId ? undefined : prev))
    })
  })

  return createRender<PopoverTitleState, Record<string, unknown>>({
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

/** Public state for {@link PopoverTitle}. */
export interface PopoverTitleState extends Record<string, unknown> {}

/** Props for {@link PopoverTitle}. */
export type PopoverTitleProps = JSX.HTMLAttributes<HTMLHeadingElement> & {
  render?: RenderProp<PopoverTitleState, Record<string, unknown>>
}
