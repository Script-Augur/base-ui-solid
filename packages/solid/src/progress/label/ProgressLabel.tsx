import {
  createEffect,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useProgressRootContext } from '../root/ProgressRootContext'

import { ProgressLabelDataAttributes } from './ProgressLabelDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { ProgressRootState } from '../root/ProgressRoot'
import type { JSX } from 'solid-js'

/**
 * An accessible label for the progress bar.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 *
 * @param componentProps - Label props (`id`, `render`, …).
 * @returns A Solid JSX element.
 */
export function ProgressLabel(componentProps: ProgressLabelProps): JSX.Element {
  const context = useProgressRootContext()

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

  const state: ProgressLabelState = {
    get status() {
      return context.status()
    },
  }

  return createRender<ProgressLabelState, Record<string, unknown>>({
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
      get [ProgressLabelDataAttributes.indeterminate]() {
        return dataAttr(context.status() === 'indeterminate')
      },
      get [ProgressLabelDataAttributes.progressing]() {
        return dataAttr(context.status() === 'progressing')
      },
      get [ProgressLabelDataAttributes.complete]() {
        return dataAttr(context.status() === 'complete')
      },
      ref: local.ref,
    }),
  })
}
/** Public state exposed to `render` functions. */
export interface ProgressLabelState
  extends ProgressRootState, Record<string, unknown> {}
/** Props for {@link ProgressLabel}. */
export type ProgressLabelProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  render?: RenderProp<ProgressLabelState, Record<string, unknown>>
}
