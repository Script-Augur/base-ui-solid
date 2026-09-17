import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useSelectRootContext } from '../root/SelectRootContext'
import { selectTransitionStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * An overlay displayed beneath the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Backdrop props.
 * @returns A Solid JSX element.
 */
export function SelectBackdrop(
  componentProps: SelectBackdropProps
): JSX.Element {
  const context = useSelectRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: SelectBackdropState = {
    get open() {
      return context.open()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
  }

  return createRender<SelectBackdropState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: selectTransitionStateMapping,
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
  })
}

/** Public state for {@link SelectBackdrop}. */
export interface SelectBackdropState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link SelectBackdrop}. */
export type SelectBackdropProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<SelectBackdropState, Record<string, unknown>>
}
