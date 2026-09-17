import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useDialogRootContext } from '../root/DialogRootContext'
import { popupTransitionStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Backdrop props (`forceRender`, …).
 * @returns A Solid JSX element (empty when nested unless `forceRender`).
 */
export function DialogBackdrop(
  componentProps: DialogBackdropProps
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

  const state: DialogBackdropState = {
    get open() {
      return context.open()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
  }

  return (
    <Show when={enabled()}>
      {createRender<DialogBackdropState, Record<string, unknown>>({
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

/** Public state for {@link DialogBackdrop}. */
export interface DialogBackdropState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link DialogBackdrop}. */
export type DialogBackdropProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Whether the backdrop is forced to render even when nested.
   * @default false
   */
  forceRender?: boolean
  render?: RenderProp<DialogBackdropState, Record<string, unknown>>
}
