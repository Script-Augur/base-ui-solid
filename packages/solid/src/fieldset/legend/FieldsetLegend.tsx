import {
  createEffect,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useFieldsetRootContext } from '../root/FieldsetRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { FieldsetRootState } from '../root/FieldsetRoot'
import type { JSX } from 'solid-js'

/**
 * An accessible label that is automatically associated with the fieldset.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 *
 * @param componentProps - Legend props (`id`, `render`, …).
 * @returns A Solid JSX element.
 */
export function FieldsetLegend(
  componentProps: FieldsetLegendProps
): JSX.Element {
  const context = useFieldsetRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'ref',
  ])

  const generatedId = createUniqueId()
  const id = () => local.id ?? generatedId

  createEffect(() => {
    const currentId = id()
    context.legendIdAssign(currentId)
    onCleanup(() => {
      context.legendIdAssign(previous =>
        previous === currentId ? undefined : previous
      )
    })
  })

  const state: FieldsetLegendState = {
    get disabled() {
      return context.disabled()
    },
  }

  return createRender<FieldsetLegendState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
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
      get 'data-disabled'() {
        return dataAttr(context.disabled())
      },
      ref: local.ref,
    }),
  })
}

/** Public state exposed to `render` functions. */
export interface FieldsetLegendState
  extends FieldsetRootState, Record<string, unknown> {}

/** Props for {@link FieldsetLegend}. */
export type FieldsetLegendProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<FieldsetLegendState, Record<string, unknown>>
}
