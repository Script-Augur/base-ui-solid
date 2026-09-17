import { ownerDocument } from '@script-augur/base-ui-utils'
import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import {
  createLabel,
  focusElementWithVisible,
} from '../../internals/labelable-provider/createLabel'
import { useSliderRootContext } from '../root/SliderRootContext'
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { SliderRootState } from '../root/SliderRoot'
import type { JSX } from 'solid-js'

/**
 * An accessible label that is automatically associated with the slider thumbs.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderLabel(componentProps: SliderLabelProps): JSX.Element {
  const { state, labelIdAssign, controlRef, rootLabelId } =
    useSliderRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
    'children',
  ])

  // Keep label id derived from the root and ignore runtime `id` overrides.
  const elementPropsWithoutId = { ...elementProps } as Record<
    string,
    unknown
  > & { id?: string }
  delete elementPropsWithoutId.id

  function focusControl(event: MouseEvent, controlId: string | null | undefined) {
    if (controlId) {
      const controlElement = ownerDocument(
        event.currentTarget as Node
      ).getElementById(controlId)
      if (controlElement instanceof HTMLElement) {
        focusElementWithVisible(controlElement)
        return
      }
    }

    const fallbackInputs =
      controlRef.current?.querySelectorAll('input[type="range"]')
    const fallbackInput =
      fallbackInputs?.length === 1 ? fallbackInputs[0] : null
    if (fallbackInput instanceof HTMLElement) {
      focusElementWithVisible(fallbackInput)
    }
  }

  const labelProps = createLabel({
    id: rootLabelId,
    labelIdAssign,
    focusControl,
  })

  return createRender<SliderLabelState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    stateAttributesMapping: sliderStateAttributesMapping,
    props: mergeProps(
      elementPropsWithoutId,
      () => labelProps(),
      {
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get children() {
          return local.children
        },
        ref: local.ref,
      }
    ),
  })
}

/** Public state exposed to `render` functions. */
export interface SliderLabelState extends SliderRootState {}

/** Props for {@link SliderLabel}. */
export type SliderLabelProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'id' | 'color'
> & {
  render?: RenderProp<SliderLabelState, Record<string, unknown>>
}
