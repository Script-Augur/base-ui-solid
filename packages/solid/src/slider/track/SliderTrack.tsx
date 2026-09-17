import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useSliderRootContext } from '../root/SliderRootContext'
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { SliderRootState } from '../root/SliderRoot'
import type { JSX } from 'solid-js'

/**
 * Contains the slider indicator and represents the entire range of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderTrack(componentProps: SliderTrackProps): JSX.Element {
  const { state } = useSliderRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
    'children',
  ])

  return createRender<SliderTrackState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    stateAttributesMapping: sliderStateAttributesMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get style() {
        const userStyle = local.style
        const base: JSX.CSSProperties = { position: 'relative' }
        if (userStyle == null) return base
        if (typeof userStyle === 'string') return userStyle
        return { ...base, ...userStyle }
      },
      get class() {
        return local.class
      },
      get children() {
        return local.children
      },
      ref: local.ref,
    }),
  })
}

/** Public state exposed to `render` functions. */
export interface SliderTrackState extends SliderRootState {}

/** Props for {@link SliderTrack}. */
export type SliderTrackProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'color'
> & {
  render?: RenderProp<SliderTrackState, Record<string, unknown>>
}
