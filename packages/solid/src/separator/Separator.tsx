import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../internals/createRender'

import { SeparatorDataAttributes } from './SeparatorDataAttributes'

import type { RenderProp } from '../internals/createRender'
import type { JSX } from 'solid-js'
/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
 *
 * @param componentProps - Separator props (`orientation`, `render`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Separator } from "@script-augur/base-ui-solid/separator"
 *
 * <Separator />
 * <Separator orientation="vertical" />
 * ```
 */
export function Separator(componentProps: SeparatorProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'orientation',
    'ref',
  ])

  const orientation = () => local.orientation ?? 'horizontal'

  const state: SeparatorState = {
    get orientation() {
      return orientation()
    },
  }

  return createRender<SeparatorState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get role() {
        return 'separator' as const
      },
      get 'aria-orientation'() {
        return orientation()
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get [SeparatorDataAttributes.orientation]() {
        return orientation()
      },
      ref: local.ref,
    }),
  })
}
/** Separator / layout orientation. */
export type Orientation = 'horizontal' | 'vertical'
/**
 * Public state exposed to `render` functions.
 */
export interface SeparatorState extends Record<string, unknown> {
  /** The orientation of the separator. */
  orientation: Orientation
}
/**
 * Props for {@link Separator}.
 */
export type SeparatorProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'role'
> & {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<SeparatorState, Record<string, unknown>>
}
