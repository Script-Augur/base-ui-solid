import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import type { RenderProp } from '../../internals/createRender'
import type { MeterRootState } from '../root/MeterRoot'
import type { JSX } from 'solid-js'

/**
 * Contains the meter indicator and represents the entire range of the meter.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 *
 * @param componentProps - Track props (`render`, …).
 * @returns A Solid JSX element.
 */
export function MeterTrack(componentProps: MeterTrackProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: MeterTrackState = {}

  return createRender<MeterTrackState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
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
export interface MeterTrackState
  extends MeterRootState, Record<string, unknown> {}

/** Props for {@link MeterTrack}. */
export type MeterTrackProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<MeterTrackState, Record<string, unknown>>
}
