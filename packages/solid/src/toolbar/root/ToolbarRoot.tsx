import { createMemo, createSignal, splitProps } from 'solid-js'

import { CompositeRoot } from '../../internals/composite/root/CompositeRoot'

import { ToolbarRootContext } from './ToolbarRootContext'

import type { CompositeMetadata } from '../../internals/composite/list/CompositeList'
import type { RenderProp } from '../../internals/createRender'
import type { Orientation } from '../../separator/Separator'
import type { JSX } from 'solid-js'

/**
 * A container for grouping a set of controls, such as buttons, toggle groups, or menus.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 *
 * @param componentProps - Toolbar root props (`disabled`, `orientation`, `loopFocus`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Toolbar } from "@script-augur/base-ui-solid/toolbar"
 *
 * <Toolbar.Root>
 *   <Toolbar.Button>Cut</Toolbar.Button>
 *   <Toolbar.Button>Copy</Toolbar.Button>
 * </Toolbar.Root>
 * ```
 */
export function ToolbarRoot(componentProps: ToolbarRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'loopFocus',
    'orientation',
    'ref',
    'children',
  ])

  const disabled = () => local.disabled ?? false
  const orientation = () => local.orientation ?? 'horizontal'
  const loopFocus = () => local.loopFocus ?? true

  const [itemMap, itemMapAssign] = createSignal(
    new Map<Node, CompositeMetadata<ToolbarRootItemMetadata>>()
  )

  const disabledIndices = createMemo(() => {
    const output: Array<number> = []
    for (const itemMetadata of itemMap().values()) {
      // Only items that are disabled and not focusable when disabled
      // are removed from roving focus.
      if (itemMetadata.disabled && !itemMetadata.focusableWhenDisabled) {
        output.push(itemMetadata.index)
      }
    }
    return output
  })

  const state: ToolbarRootState = {
    get disabled() {
      return disabled()
    },
    get orientation() {
      return orientation()
    },
  }

  const contextValue = {
    disabled,
    orientation,
  }

  return (
    <ToolbarRootContext.Provider value={contextValue}>
      <CompositeRoot<ToolbarRootItemMetadata, ToolbarRootState>
        render={local.render}
        class={local.class}
        style={local.style}
        state={state}
        refs={[setRootRef]}
        props={[defaultProps, elementProps]}
        disabledIndices={disabledIndices}
        loopFocus={loopFocus}
        onMapChange={itemMapAssign}
        orientation={orientation}
        stateAttributesMapping={{}}
        tag="div"
      >
        {local.children}
      </CompositeRoot>
    </ToolbarRootContext.Provider>
  )

  /**
   * Default host props for the toolbar: role and orientation.
   *
   * @returns Props bag for {@link CompositeRoot}.
   */
  function defaultProps(): Record<string, unknown> {
    return {
      role: 'toolbar',
      get 'aria-orientation'() {
        return orientation()
      },
    }
  }

  /**
   * Forwards the host element to the consumer `ref`.
   *
   * @param el - Mounted root element, or `null` on unmount.
   */
  function setRootRef(el: HTMLElement | null) {
    const userRef = local.ref
    if (typeof userRef === 'function') {
      userRef(el as HTMLDivElement)
    }
  }
}

/**
 * Per-item metadata stored in the toolbar composite map.
 */
export interface ToolbarRootItemMetadata {
  /** Whether the item ignores user interaction. */
  disabled: boolean
  /** Whether the item remains focusable when disabled. */
  focusableWhenDisabled: boolean
}

/**
 * Public state exposed to `render` functions.
 */
export interface ToolbarRootState extends Record<string, unknown> {
  /** Whether the toolbar ignores user interaction. */
  disabled: boolean
  /** Layout / arrow-key orientation of the toolbar. */
  orientation: Orientation
}

/**
 * Props for {@link ToolbarRoot}.
 */
export type ToolbarRootProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /** Whether the toolbar (and nested items) ignore user interaction. @default false */
  disabled?: boolean
  /**
   * The orientation of the toolbar.
   * @default 'horizontal'
   */
  orientation?: Orientation
  /**
   * If `true`, keyboard navigation wraps focus to the other end of the toolbar
   * once the end is reached.
   *
   * @default true
   */
  loopFocus?: boolean
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ToolbarRootState, Record<string, unknown>>
}

export type { Orientation as ToolbarRootOrientation }
