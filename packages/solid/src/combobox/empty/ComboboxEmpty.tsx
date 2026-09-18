import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useComboboxRootContext } from '../root/ComboboxRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Renders its children only when the list is empty.
 * Announces changes politely to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Empty props.
 * @returns A Solid JSX element.
 */
export function ComboboxEmpty(componentProps: ComboboxEmptyProps): JSX.Element {
  const context = useComboboxRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const empty = () => context.listEmpty()

  const state: ComboboxEmptyState = {}

  return createRender<ComboboxEmptyState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      role: 'status',
      'aria-live': 'polite',
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get children() {
        return (
          <Show when={empty() && context.open()}>{local.children}</Show>
        )
      },
      ref: local.ref,
    }),
  })
}

/** Public state for {@link ComboboxEmpty}. */
export interface ComboboxEmptyState extends Record<string, unknown> {}

/** Props for {@link ComboboxEmpty}. */
export type ComboboxEmptyProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxEmptyState, Record<string, unknown>>
}
