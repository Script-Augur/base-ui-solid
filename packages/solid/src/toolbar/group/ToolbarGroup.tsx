import { splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useToolbarRootContext } from '../root/ToolbarRootContext'

import { ToolbarGroupContext } from './ToolbarGroupContext'

import type { RenderProp } from '../../internals/createRender'
import type { ToolbarRootState } from '../root/ToolbarRoot'
import type { JSX } from 'solid-js'

/**
 * Groups several toolbar items or toggles.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 *
 * @param componentProps - Toolbar group props (`disabled`, `render`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Toolbar } from "@script-augur/base-ui-solid/toolbar"
 *
 * <Toolbar.Root>
 *   <Toolbar.Group>
 *     <Toolbar.Button>Bold</Toolbar.Button>
 *     <Toolbar.Button>Italic</Toolbar.Button>
 *   </Toolbar.Group>
 * </Toolbar.Root>
 * ```
 */
export function ToolbarGroup(componentProps: ToolbarGroupProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'ref',
    'children',
  ])

  const root = useToolbarRootContext()

  const disabled = () => root.disabled() || (local.disabled ?? false)

  const state: ToolbarGroupState = {
    get disabled() {
      return disabled()
    },
    get orientation() {
      return root.orientation()
    },
  }

  const contextValue = {
    disabled,
  }

  return (
    <ToolbarGroupContext.Provider value={contextValue}>
      {createRender<ToolbarGroupState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        stateAttributesMapping: {},
        props: [
          { role: 'group' },
          elementProps,
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
          },
        ],
      })}
    </ToolbarGroupContext.Provider>
  )
}

/**
 * Public state exposed to `render` functions.
 */
export interface ToolbarGroupState extends ToolbarRootState {}

/**
 * Props for {@link ToolbarGroup}.
 */
export type ToolbarGroupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * When `true` all toolbar items in the group are disabled.
   * @default false
   */
  disabled?: boolean
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ToolbarGroupState, Record<string, unknown>>
}
