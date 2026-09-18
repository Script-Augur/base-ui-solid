import { Show, mergeProps, splitProps } from 'solid-js'

import { useDialogRootContext } from '../../dialog/root/DialogRootContext'
import { popupTransitionStateMapping } from '../../dialog/utils/stateAttributesMapping'
import { createRender } from '../../internals/createRender'
import { DrawerPopupCssVars } from '../popup/DrawerPopupCssVars'

import { DrawerBackdropCssVars } from './DrawerBackdropCssVars'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Lite: swipe CSS vars stay at idle (`0` / `1`).
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param componentProps - Backdrop props (`forceRender`, …).
 * @returns A Solid JSX element (empty when nested unless `forceRender`).
 */
export function DrawerBackdrop(
  componentProps: DrawerBackdropProps
): JSX.Element {
  const context = useDialogRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'forceRender',
    'ref',
  ])

  const enabled = () => (local.forceRender ?? false) || !context.nested()

  const state: DrawerBackdropState = {
    get open() {
      return context.open()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
  }

  return (
    <Show when={enabled()}>
      {createRender<DrawerBackdropState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: popupTransitionStateMapping,
        props: mergeProps(elementProps as Record<string, unknown>, {
          role: 'presentation',
          get ['attr:hidden']() {
            return context.mounted() ? undefined : true
          },
          get class() {
            return local.class
          },
          get style() {
            const base: JSX.CSSProperties = {
              'user-select': 'none',
              '-webkit-user-select': 'none',
              'pointer-events': !context.open() ? 'none' : undefined,
              [DrawerBackdropCssVars.swipeProgress]: '0',
              [DrawerPopupCssVars.swipeStrength]: '1',
            }
            const user = local.style
            if (user && typeof user === 'object' && !Array.isArray(user)) {
              return { ...base, ...user }
            }
            return base
          },
          ref(element: HTMLElement) {
            context.backdropElementAssign(element)
            const userRef = local.ref
            if (typeof userRef === 'function') {
              userRef(element as HTMLDivElement)
            }
          },
        }),
      })}
    </Show>
  )
}

/** Public state for {@link DrawerBackdrop}. */
export interface DrawerBackdropState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link DrawerBackdrop}. */
export type DrawerBackdropProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Whether the backdrop is forced to render even when nested.
   * @default false
   */
  forceRender?: boolean
  render?: RenderProp<DrawerBackdropState, Record<string, unknown>>
}
