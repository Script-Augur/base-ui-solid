import { splitProps } from 'solid-js'

import { CompositeItem } from '../../internals/composite/item/CompositeItem'
import { useToolbarRootContext } from '../root/ToolbarRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { Orientation } from '../../separator/Separator'
import type { ToolbarRootItemMetadata } from '../root/ToolbarRoot'
import type { JSX } from 'solid-js'

const TOOLBAR_LINK_METADATA: ToolbarRootItemMetadata = {
  // Links cannot be disabled, but they still occupy a focusable composite item slot.
  disabled: false,
  focusableWhenDisabled: true,
}

/**
 * A link component.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 *
 * @param componentProps - Toolbar link props (`href`, `render`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Toolbar } from "@script-augur/base-ui-solid/toolbar"
 *
 * <Toolbar.Root>
 *   <Toolbar.Link href="https://base-ui.com">Docs</Toolbar.Link>
 * </Toolbar.Root>
 * ```
 */
export function ToolbarLink(componentProps: ToolbarLinkProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
    'children',
  ])

  const root = useToolbarRootContext()

  const state: ToolbarLinkState = {
    get orientation() {
      return root.orientation()
    },
  }

  return (
    <CompositeItem<ToolbarRootItemMetadata, ToolbarLinkState>
      tag="a"
      render={local.render}
      class={local.class}
      style={local.style}
      metadata={TOOLBAR_LINK_METADATA}
      state={state}
      stateAttributesMapping={{}}
      refs={[assignRef]}
      props={[elementProps]}
    >
      {local.children}
    </CompositeItem>
  )

  /**
   * Forwards the host element to the consumer `ref`.
   *
   * @param element - Mounted anchor element, or `null` on unmount.
   */
  function assignRef(element: HTMLElement | null) {
    const userRef = local.ref
    if (typeof userRef === 'function' && element) {
      userRef(element as HTMLAnchorElement)
    }
  }
}

/**
 * Public state exposed to `render` functions.
 */
export interface ToolbarLinkState extends Record<string, unknown> {
  /** The component orientation. */
  orientation: Orientation
}

/**
 * Props for {@link ToolbarLink}.
 */
export type ToolbarLinkProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** Link label / content. */
  children?: JSX.Element
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ToolbarLinkState, Record<string, unknown>>
}
