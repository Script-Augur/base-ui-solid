import {
  createEffect,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useMeterRootContext } from '../root/MeterRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { MeterRootState } from '../root/MeterRoot'
import type { JSX } from 'solid-js'

/**
 * An accessible label for the meter.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 *
 * @param componentProps - Label props (`id`, `render`, …).
 * @returns A Solid JSX element.
 */
export function MeterLabel(componentProps: MeterLabelProps): JSX.Element {
  const context = useMeterRootContext()

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
    context.labelIdAssign(currentId)
    onCleanup(() => {
      context.labelIdAssign(previous =>
        previous === currentId ? undefined : previous
      )
    })
  })

  const state: MeterLabelState = {}

  return createRender<MeterLabelState, Record<string, unknown>>({
    defaultElement: 'span',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return id()
      },
      get role() {
        return 'presentation' as const
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      ref: local.ref,
    }),
  })
}

/** Public state exposed to `render` functions. */
export interface MeterLabelState
  extends MeterRootState, Record<string, unknown> {}

/** Props for {@link MeterLabel}. */
export type MeterLabelProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  render?: RenderProp<MeterLabelState, Record<string, unknown>>
}
