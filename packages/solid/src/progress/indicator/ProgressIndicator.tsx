import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useProgressRootContext } from '../root/ProgressRootContext'

import { ProgressIndicatorDataAttributes } from './ProgressIndicatorDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { ProgressRootState } from '../root/ProgressRoot'
import type { JSX } from 'solid-js'

/**
 * Visualizes the completion status of the task.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 *
 * @param componentProps - Indicator props (`render`, …).
 * @returns A Solid JSX element.
 */
export function ProgressIndicator(
  componentProps: ProgressIndicatorProps
): JSX.Element {
  const context = useProgressRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: ProgressIndicatorState = {
    get status() {
      return context.status()
    },
  }

  const indicatorStyle = (): JSX.CSSProperties => {
    const percentageValue = context.percentageValue()
    if (percentageValue == null) {
      return {}
    }

    return {
      'inset-inline-start': 0,
      height: 'inherit',
      width: `${percentageValue}%`,
    }
  }

  const mergedStyle = (): JSX.CSSProperties | string | undefined => {
    const userStyle = local.style
    const base = indicatorStyle()
    if (userStyle == null) {
      return base
    }
    if (typeof userStyle === 'string') {
      return userStyle
    }
    return { ...base, ...userStyle }
  }

  return createRender<ProgressIndicatorState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get style() {
        return mergedStyle()
      },
      get class() {
        return local.class
      },
      get [ProgressIndicatorDataAttributes.indeterminate]() {
        return dataAttr(context.status() === 'indeterminate')
      },
      get [ProgressIndicatorDataAttributes.progressing]() {
        return dataAttr(context.status() === 'progressing')
      },
      get [ProgressIndicatorDataAttributes.complete]() {
        return dataAttr(context.status() === 'complete')
      },
      ref: local.ref,
    }),
  })
}
/** Public state exposed to `render` functions. */
export interface ProgressIndicatorState
  extends ProgressRootState, Record<string, unknown> {}
/** Props for {@link ProgressIndicator}. */
export type ProgressIndicatorProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ProgressIndicatorState, Record<string, unknown>>
}
