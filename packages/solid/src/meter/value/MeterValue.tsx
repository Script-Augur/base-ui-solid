import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useMeterRootContext } from '../root/MeterRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { MeterRootState } from '../root/MeterRoot'
import type { JSX, JSXElement } from 'solid-js'

/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 *
 * @param componentProps - Value props (`children`, `render`, …).
 * @returns A Solid JSX element.
 */
export function MeterValue(componentProps: MeterValueProps): JSX.Element {
  const context = useMeterRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: MeterValueState = {}

  return createRender<MeterValueState, Record<string, unknown>>({
    defaultElement: 'span',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get 'aria-hidden'() {
        return true
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get children() {
        const formattedValue = context.formattedValue()
        const child = local.children

        if (typeof child === 'function') {
          return child(formattedValue, context.value())
        }

        return formattedValue
      },
      ref: local.ref,
    }),
  })
}

/** Public state exposed to `render` functions. */
export interface MeterValueState
  extends MeterRootState, Record<string, unknown> {}

/** Props for {@link MeterValue}. */
export type MeterValueProps = Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'children'
> & {
  children?: null | ((formattedValue: string, value: number) => JSXElement)
  render?: RenderProp<MeterValueState, Record<string, unknown>>
}
