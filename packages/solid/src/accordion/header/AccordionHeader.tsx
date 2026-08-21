import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useAccordionItemContext } from '../item/AccordionItemContext'

import { AccordionHeaderDataAttributes } from './AccordionHeaderDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { AccordionItemState } from '../item/AccordionItem'
import type { JSX } from 'solid-js'

/**
 * A heading that labels the corresponding panel.
 * Renders an `<h3>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 *
 * @param componentProps - Header props (`render`, …).
 * @returns A Solid JSX element.
 */
export function AccordionHeader(
  componentProps: AccordionHeaderProps
): JSX.Element {
  const { state } = useAccordionItemContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  return createRender<AccordionHeaderState, Record<string, unknown>>({
    defaultElement: 'h3',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get [AccordionHeaderDataAttributes.index]() {
        return String(state.index)
      },
      get [AccordionHeaderDataAttributes.disabled]() {
        return dataAttr(state.disabled)
      },
      get [AccordionHeaderDataAttributes.open]() {
        return dataAttr(state.open)
      },
      ref: local.ref,
    }),
  })
}

/** Public state for {@link AccordionHeader} (same as item). */
export type AccordionHeaderState = AccordionItemState

/**
 * Props for {@link AccordionHeader}.
 */
export type AccordionHeaderProps = JSX.HTMLAttributes<HTMLHeadingElement> & {
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<AccordionHeaderState, Record<string, unknown>>
}
