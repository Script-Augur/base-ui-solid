import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useMenuCheckboxItemContext } from '../checkbox-item/MenuCheckboxItem'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Indicates whether the checkbox item is checked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuCheckboxItemIndicator(
  componentProps: MenuCheckboxItemIndicatorProps
): JSX.Element {
  const item = useMenuCheckboxItemContext()
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
      {createRender<MenuCheckboxItemIndicatorState, Record<string, unknown>>({
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

/** Public state for {@link MenuCheckboxItemIndicator}. */
export interface MenuCheckboxItemIndicatorState extends Record<string, unknown> {
  checked: boolean
  disabled: boolean
}

/** Props for {@link MenuCheckboxItemIndicator}. */
export type MenuCheckboxItemIndicatorProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  /**
   * @default false
   */
  keepMounted?: boolean
  render?: RenderProp<MenuCheckboxItemIndicatorState, Record<string, unknown>>
}
