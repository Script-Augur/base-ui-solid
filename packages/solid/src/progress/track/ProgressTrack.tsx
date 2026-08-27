import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useProgressRootContext } from '../root/ProgressRootContext'

import { ProgressTrackDataAttributes } from './ProgressTrackDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { ProgressRootState } from '../root/ProgressRoot'
import type { JSX } from 'solid-js'

/**
 * Contains the progress bar indicator.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 *
 * @param componentProps - Track props (`render`, …).
 * @returns A Solid JSX element.
 */
export function ProgressTrack(componentProps: ProgressTrackProps): JSX.Element {
  const context = useProgressRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: ProgressTrackState = {
    get status() {
      return context.status()
    },
  }

  return createRender<ProgressTrackState, Record<string, unknown>>({
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
      get [ProgressTrackDataAttributes.indeterminate]() {
        return dataAttr(context.status() === 'indeterminate')
      },
      get [ProgressTrackDataAttributes.progressing]() {
        return dataAttr(context.status() === 'progressing')
      },
      get [ProgressTrackDataAttributes.complete]() {
        return dataAttr(context.status() === 'complete')
      },
      ref: local.ref,
    }),
  })
}
/** Public state exposed to `render` functions. */
export interface ProgressTrackState
  extends ProgressRootState, Record<string, unknown> {}
/** Props for {@link ProgressTrack}. */
export type ProgressTrackProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ProgressTrackState, Record<string, unknown>>
}
