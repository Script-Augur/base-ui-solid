import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useMeterRootContext } from '../root/MeterRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { MeterRootState } from '../root/MeterRoot'
import type { JSX } from 'solid-js'

/**
 * Visualizes the position of the value along the range.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 *
 * @param componentProps - Indicator props (`render`, …).
 * @returns A Solid JSX element.
 */
export function MeterIndicator(
  componentProps: MeterIndicatorProps
): JSX.Element {
  const context = useMeterRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: MeterIndicatorState = {}

  const indicatorStyle = (): JSX.CSSProperties => ({
    'inset-inline-start': 0,
    height: 'inherit',
    width: `${context.percentageValue()}%`,
  })

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

  return createRender<MeterIndicatorState, Record<string, unknown>>({
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
      ref: local.ref,
    }),
  })
}

/** Public state exposed to `render` functions. */
export interface MeterIndicatorState
  extends MeterRootState, Record<string, unknown> {}

/** Props for {@link MeterIndicator}. */
export type MeterIndicatorProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<MeterIndicatorState, Record<string, unknown>>
}
