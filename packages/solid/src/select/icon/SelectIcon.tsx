import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useSelectRootContext } from '../root/SelectRootContext'
import { selectTriggerOpenStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An icon that indicates that the trigger button opens a select popup.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Icon props.
 * @returns A Solid JSX element.
 */
export function SelectIcon(componentProps: SelectIconProps): JSX.Element {
  const context = useSelectRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: SelectIconState = {
    get open() {
      return context.open()
    },
  }

  return createRender<SelectIconState, Record<string, unknown>>({
    defaultElement: 'span',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: selectTriggerOpenStateMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      'aria-hidden': true,
      get children() {
        return local.children ?? '\u25BC'
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

/** Public state for {@link SelectIcon}. */
export interface SelectIconState extends Record<string, unknown> {
  open: boolean
}

/** Props for {@link SelectIcon}. */
export type SelectIconProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  render?: RenderProp<SelectIconState, Record<string, unknown>>
}
