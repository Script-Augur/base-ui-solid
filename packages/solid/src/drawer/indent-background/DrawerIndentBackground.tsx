import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useDrawerProviderContext } from '../provider/DrawerProviderContext'

import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

const ACTIVE_HOOK = { 'data-active': '' }
const INACTIVE_HOOK = { 'data-inactive': '' }

const indentBackgroundStateAttributesMapping: StateAttributesMapping<{
  active: boolean
}> = {
  active(value) {
    return value ? ACTIVE_HOOK : INACTIVE_HOOK
  },
}

/**
 * An element placed before `<Drawer.Indent>` to render a background layer that
 * can be styled based on whether any drawer is open.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param componentProps - IndentBackground props.
 * @returns A Solid JSX element.
 */
export function DrawerIndentBackground(
  componentProps: DrawerIndentBackgroundProps
): JSX.Element {
  const providerContext = useDrawerProviderContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: DrawerIndentBackgroundState = {
    get active() {
      return providerContext?.active() ?? false
    },
  }

  return createRender<DrawerIndentBackgroundState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: indentBackgroundStateAttributesMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      children: local.children,
      ref: local.ref,
    }),
  })
}

/** Public state for {@link DrawerIndentBackground}. */
export interface DrawerIndentBackgroundState extends Record<string, unknown> {
  /**
   * Whether any drawer within the nearest `<Drawer.Provider>` is open.
   */
  active: boolean
}

/** Props for {@link DrawerIndentBackground}. */
export type DrawerIndentBackgroundProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<DrawerIndentBackgroundState, Record<string, unknown>>
}
