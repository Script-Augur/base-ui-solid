import { valueToPercent } from '@script-augur/base-ui-utils'
import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useSliderRootContext } from '../root/SliderRootContext'
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { SliderRootState } from '../root/SliderRoot'
import type { JSX } from 'solid-js'
/**
 * Visualizes the current value of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderIndicator(
  componentProps: SliderIndicatorProps
): JSX.Element {
  const {
    indicatorPosition,
    inset,
    max,
    min,
    orientation,
    renderBeforeHydration,
    state,
    values,
  } = useSliderRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  // Solid has no SSR prehydration script; `edge`/`edge-client-only` both measure client-side.
  void renderBeforeHydration

  const indicatorStyle = (): JSX.CSSProperties => {
    const vertical = orientation() === 'vertical'
    const vals = values()
    const range = vals.length > 1
    const isInset = inset()

    const base = getIndicatorStyles(
      vertical,
      range,
      isInset,
      isInset
        ? indicatorPosition()[0]
        : valueToPercent(vals[0]!, min(), max()),
      isInset
        ? indicatorPosition()[1]
        : valueToPercent(vals[vals.length - 1]!, min(), max()),
      false
    )

    const userStyle = local.style
    if (userStyle == null) return base
    if (typeof userStyle === 'string') return userStyle as unknown as JSX.CSSProperties
    return { ...base, ...userStyle }
  }

  return createRender<SliderIndicatorState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    stateAttributesMapping: sliderStateAttributesMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get style() {
        return indicatorStyle()
      },
      get class() {
        return local.class
      },
      ref: local.ref,
    }),
  })
}
/** Public state exposed to `render` functions. */
export interface SliderIndicatorState extends SliderRootState {}
/** Props for {@link SliderIndicator}. */
export type SliderIndicatorProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'color'
> & {
  render?: RenderProp<SliderIndicatorState, Record<string, unknown>>
}
function getIndicatorStyles(
  vertical: boolean,
  range: boolean,
  inset: boolean,
  start: number | undefined,
  end: number | undefined,
  forceHidden: boolean
): JSX.CSSProperties & Record<string, unknown> {
  const styles: JSX.CSSProperties & Record<string, unknown> = {
    visibility:
      forceHidden || (inset && (start === undefined || (range && end === undefined)))
        ? ('hidden' as const)
        : undefined,
    position: vertical ? 'absolute' : 'relative',
    [vertical ? 'width' : 'height']: 'inherit',
  }

  let startValue = `${start ?? 0}%`
  let sizeValue = `${(end ?? 0) - (start ?? 0)}%`

  if (inset) {
    styles['--start-position'] = startValue
    startValue = 'var(--start-position)'

    if (range) {
      styles['--relative-size'] = sizeValue
      sizeValue = 'var(--relative-size)'
    }
  }

  styles[vertical ? 'bottom' : 'inset-inline-start'] = range ? startValue : 0
  styles[vertical ? 'height' : 'width'] = range ? sizeValue : startValue

  return styles
}
