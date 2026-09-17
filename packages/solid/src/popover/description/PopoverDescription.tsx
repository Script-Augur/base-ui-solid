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
 * A paragraph with additional information about the popover.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 *
 * @param componentProps - Description props.
 * @returns A Solid JSX element.
 */
export function PopoverDescription(
  componentProps: PopoverDescriptionProps
): JSX.Element {
  const context = usePopoverRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'children',
    'ref',
  ])

  const id = createMemo(
    () => local.id ?? generateId('base-ui-popover-description')
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

  return createRender<PopoverDescriptionState, Record<string, unknown>>({
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

/** Public state for {@link PopoverDescription}. */
export interface PopoverDescriptionState extends Record<string, unknown> {}

/** Props for {@link PopoverDescription}. */
export type PopoverDescriptionProps =
  JSX.HTMLAttributes<HTMLParagraphElement> & {
    render?: RenderProp<PopoverDescriptionState, Record<string, unknown>>
  }
