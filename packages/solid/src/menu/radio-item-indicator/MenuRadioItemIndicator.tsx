import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useMenuRadioItemContext } from '../radio-item/MenuRadioItem'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Indicates whether the radio item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuRadioItemIndicator(
  componentProps: MenuRadioItemIndicatorProps
): JSX.Element {
  const item = useMenuRadioItemContext()
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'keepMounted',
  ])

  const keepMounted = () => local.keepMounted ?? false

  return (
    <Show when={item.checked() || keepMounted()}>
      {createRender<MenuRadioItemIndicatorState, Record<string, unknown>>({
        defaultElement: 'span',
        state: {
          get checked() {
            return item.checked()
          },
          get disabled() {
            return item.disabled()
          },
        },
        render: local.render,
        mapStateToDataAttributes: true,
        props: mergeProps(elementProps as Record<string, unknown>, {
          'aria-hidden': true,
          get ['attr:hidden']() {
            return item.checked() ? undefined : true
          },
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          children: local.children,
          ref: local.ref,
        }),
      })}
    </Show>
  )
}

/** Public state for {@link MenuRadioItemIndicator}. */
export interface MenuRadioItemIndicatorState extends Record<string, unknown> {
  checked: boolean
  disabled: boolean
}

/** Props for {@link MenuRadioItemIndicator}. */
export type MenuRadioItemIndicatorProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  /**
   * @default false
   */
  keepMounted?: boolean
  render?: RenderProp<MenuRadioItemIndicatorState, Record<string, unknown>>
}
