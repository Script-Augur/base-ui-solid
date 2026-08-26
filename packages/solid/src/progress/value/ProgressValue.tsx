import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useProgressRootContext } from '../root/ProgressRootContext'

import { ProgressValueDataAttributes } from './ProgressValueDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { ProgressRootState } from '../root/ProgressRoot'
import type { JSX, JSXElement } from 'solid-js'

export { ProgressValueDataAttributes }
/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 *
 * @param componentProps - Value props (`children`, `render`, …).
 * @returns A Solid JSX element.
 */
export function ProgressValue(componentProps: ProgressValueProps): JSX.Element {
  const context = useProgressRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: ProgressValueState = {
    get status() {
      return context.status()
    },
  }

  return createRender<ProgressValueState, Record<string, unknown>>({
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
        const indeterminate = context.status() === 'indeterminate'
        const formattedValue = context.formattedValue()
        const child = local.children

        if (typeof child === 'function') {
          return child(
            indeterminate ? 'indeterminate' : formattedValue,
            context.value()
          )
        }

        return indeterminate ? null : formattedValue
      },
      get [ProgressValueDataAttributes.indeterminate]() {
        return dataAttr(context.status() === 'indeterminate')
      },
      get [ProgressValueDataAttributes.progressing]() {
        return dataAttr(context.status() === 'progressing')
      },
      get [ProgressValueDataAttributes.complete]() {
        return dataAttr(context.status() === 'complete')
      },
      ref: local.ref,
    }),
  })
}
/** Public state exposed to `render` functions. */
export interface ProgressValueState
  extends ProgressRootState, Record<string, unknown> {}
/** Props for {@link ProgressValue}. */
export type ProgressValueProps = Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'children'
> & {
  children?:
    null | ((formattedValue: string | null, value: number | null) => JSXElement)
  render?: RenderProp<ProgressValueState, Record<string, unknown>>
}
