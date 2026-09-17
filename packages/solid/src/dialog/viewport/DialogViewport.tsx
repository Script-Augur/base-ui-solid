import { Show, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useDialogPortalContext } from '../portal/DialogPortalContext'
import { useDialogRootContext } from '../root/DialogRootContext'
import { dialogStateAttributesMapping } from '../utils/stateAttributesMapping'

import { DialogViewportDataAttributes } from './DialogViewportDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * A positioning container for the dialog popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Viewport props.
 * @returns A Solid JSX element when mounted / keepMounted.
 */
export function DialogViewport(
  componentProps: DialogViewportProps
): JSX.Element {
  const keepMounted = useDialogPortalContext()
  const context = useDialogRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const nestedDialogOpen = () => context.nestedOpenDialogCount() > 0

  const state: DialogViewportState = {
    get open() {
      return context.open()
    },
    get nested() {
      return context.nested()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
    get nestedDialogOpen() {
      return nestedDialogOpen()
    },
  }

  const shouldRender = () => keepMounted || context.mounted()

  return (
    <Show when={shouldRender()}>
      {createRender<DialogViewportState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: dialogStateAttributesMapping,
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
              'pointer-events': !context.open() ? 'none' : undefined,
            }
            const user = local.style
            if (user && typeof user === 'object' && !Array.isArray(user)) {
              return { ...base, ...user }
            }
            return base
          },
          get [DialogViewportDataAttributes.nested]() {
            return context.nested() ? '' : undefined
          },
          children: local.children,
          ref(element: HTMLElement) {
            context.viewportElementAssign(element)
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

/** Public state for {@link DialogViewport}. */
export interface DialogViewportState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
  nested: boolean
  nestedDialogOpen: boolean
}

/** Props for {@link DialogViewport}. */
export type DialogViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<DialogViewportState, Record<string, unknown>>
}
