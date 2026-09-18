import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { DrawerBackdropCssVars } from '../backdrop/DrawerBackdropCssVars'
import { DrawerPopupCssVars } from '../popup/DrawerPopupCssVars'
import { useDrawerProviderContext } from '../provider/DrawerProviderContext'

import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

const ACTIVE_HOOK = { 'data-active': '' }
const INACTIVE_HOOK = { 'data-inactive': '' }

const indentStateAttributesMapping: StateAttributesMapping<{
  active: boolean
}> = {
  active(value) {
    return value ? ACTIVE_HOOK : INACTIVE_HOOK
  },
}

/**
 * A wrapper element intended to contain your app's main UI.
 * Applies `data-active` when any drawer within the nearest `<Drawer.Provider>` is open.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param componentProps - Indent props.
 * @returns A Solid JSX element.
 */
export function DrawerIndent(componentProps: DrawerIndentProps): JSX.Element {
  const providerContext = useDrawerProviderContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  let indentElement: HTMLElement | null = null

  createEffect(() => {
    const element = indentElement
    const visualStateStore = providerContext?.visualStateStore
    if (!element || !visualStateStore) return

    const syncVisualState = () => {
      const { swipeProgress, frontmostHeight } = visualStateStore.getSnapshot()
      if (swipeProgress <= 0) {
        element.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0')
      } else {
        element.style.setProperty(
          DrawerBackdropCssVars.swipeProgress,
          `${swipeProgress}`
        )
      }
      if (frontmostHeight <= 0) {
        element.style.removeProperty(DrawerPopupCssVars.height)
      } else {
        element.style.setProperty(
          DrawerPopupCssVars.height,
          `${frontmostHeight}px`
        )
      }
    }

    syncVisualState()
    const unsubscribe = visualStateStore.subscribe(syncVisualState)
    onCleanup(() => {
      unsubscribe()
      element.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0')
      element.style.removeProperty(DrawerPopupCssVars.height)
    })
  })

  const state: DrawerIndentState = {
    get active() {
      return providerContext?.active() ?? false
    },
  }

  return createRender<DrawerIndentState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: indentStateAttributesMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get class() {
        return local.class
      },
      get style() {
        const base: JSX.CSSProperties = {
          [DrawerBackdropCssVars.swipeProgress]: '0',
        }
        const user = local.style
        if (user && typeof user === 'object' && !Array.isArray(user)) {
          return { ...base, ...user }
        }
        return base
      },
      children: local.children,
      ref(element: HTMLElement) {
        indentElement = element
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}

/** Public state for {@link DrawerIndent}. */
export interface DrawerIndentState extends Record<string, unknown> {
  /**
   * Whether any drawer within the nearest `<Drawer.Provider>` is open.
   */
  active: boolean
}

/** Props for {@link DrawerIndent}. */
export type DrawerIndentProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<DrawerIndentState, Record<string, unknown>>
}
