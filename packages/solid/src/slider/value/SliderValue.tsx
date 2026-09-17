import { formatNumber } from '@script-augur/base-ui-utils'
import { createMemo, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useSliderRootContext } from '../root/SliderRootContext'
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { SliderRootState } from '../root/SliderRoot'
import type { JSX } from 'solid-js'

/**
 * Displays the current value of the slider as text.
 * Renders an `<output>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderValue(componentProps: SliderValueProps): JSX.Element {
  const { thumbMap, state, values, format, locale } = useSliderRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'aria-live',
    'ref',
  ])

  const ariaLive = () => local['aria-live'] ?? 'off'

  const outputFor = createMemo(() => {
    const forIds = Array.from(thumbMap().values(), ({ inputId }) => inputId)
      .filter(Boolean)
      .join(' ')
      .trim()
    return forIds || undefined
  })

  const formattedValues = createMemo(() =>
    values().map(v => formatNumber(v, locale(), format()))
  )

  const displayChildren = () => {
    const children = local.children
    if (typeof children === 'function') {
      return children(formattedValues(), values())
    }
    return formattedValues().join(' – ')
  }

  return createRender<SliderValueState, Record<string, unknown>>({
    defaultElement: 'output',
    state,
    render: local.render,
    stateAttributesMapping: sliderStateAttributesMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get 'aria-live'() {
        return ariaLive()
      },
      get children() {
        return displayChildren()
      },
      get for() {
        return outputFor()
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
export interface SliderValueState extends SliderRootState {}

/** Props for {@link SliderValue}. */
export type SliderValueProps = Omit<
  JSX.HTMLAttributes<HTMLOutputElement>,
  'children' | 'color'
> & {
  render?: RenderProp<SliderValueState, Record<string, unknown>>
  children?:
    | null
    | ((
        formattedValues: ReadonlyArray<string>,
        values: ReadonlyArray<number>
      ) => JSX.Element)
    | undefined
}
