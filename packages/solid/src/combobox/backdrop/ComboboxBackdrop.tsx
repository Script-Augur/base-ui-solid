import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useComboboxRootContext } from '../root/ComboboxRootContext'
import { comboboxTransitionStateMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * An overlay displayed beneath the combobox popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Backdrop props.
 * @returns A Solid JSX element.
 */
export function ComboboxBackdrop(
  componentProps: ComboboxBackdropProps
): JSX.Element {
  const context = useComboboxRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const state: ComboboxBackdropState = {
    get open() {
      return context.open()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
  }

  return createRender<ComboboxBackdropState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: comboboxTransitionStateMapping,
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
          'user-combobox': 'none',
          '-webkit-user-combobox': 'none',
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

/** Public state for {@link ComboboxBackdrop}. */
export interface ComboboxBackdropState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link ComboboxBackdrop}. */
export type ComboboxBackdropProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxBackdropState, Record<string, unknown>>
}
