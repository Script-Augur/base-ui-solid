import { splitProps } from 'solid-js'

import { Separator } from '../../separator/Separator'
import { useToolbarRootContext } from '../root/ToolbarRootContext'

import type { Orientation, SeparatorProps, SeparatorState } from '../../separator/Separator'
import type { JSX } from 'solid-js'

/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 *
 * @param componentProps - Toolbar separator props (`orientation`, `render`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Toolbar } from "@script-augur/base-ui-solid/toolbar"
 *
 * <Toolbar.Root>
 *   <Toolbar.Button>Cut</Toolbar.Button>
 *   <Toolbar.Separator />
 *   <Toolbar.Button>Copy</Toolbar.Button>
 * </Toolbar.Root>
 * ```
 */
export function ToolbarSeparator(
  componentProps: ToolbarSeparatorProps
): JSX.Element {
  const [local, rest] = splitProps(componentProps, ['orientation'])
  const context = useToolbarRootContext()

  const orientation = () =>
    local.orientation ??
    (context.orientation() === 'vertical' ? 'horizontal' : 'vertical')

  return <Separator {...rest} orientation={orientation()} />
}

/**
 * Public state exposed to `render` functions.
 */
export interface ToolbarSeparatorState extends SeparatorState {}

/**
 * Props for {@link ToolbarSeparator}.
 */
export type ToolbarSeparatorProps = SeparatorProps & {
  /**
   * The orientation of the separator. Defaults to the opposite of the toolbar's
   * orientation, so a horizontal toolbar renders vertical separators.
   */
  orientation?: Orientation
}
