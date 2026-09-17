import { Show, createSignal, mergeProps, splitProps } from 'solid-js'

import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createRender } from '../../internals/createRender'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { dataAttr } from '../../internals/useRender'
import { useRadioRootContext } from '../root/RadioRootContext'
import { stateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { RadioRootState } from '../root/RadioRoot'
import type { JSX } from 'solid-js'

/**
 * Indicates whether the radio button is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 *
 * @param componentProps - Indicator props (`keepMounted`, `render`, …).
 * @returns A Solid JSX element.
 */
export function RadioIndicator(
  componentProps: RadioIndicatorProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'keepMounted',
    'children',
    'ref',
  ])

  const rootState = useRadioRootContext()
  const rendered = () => rootState.checked

  const { mounted, mountedAssign, transitionStatus } =
    createTransitionStatus(rendered)

  const [indicatorElement, indicatorElementAssign] =
    createSignal<HTMLSpanElement | null>(null)

  createOpenChangeComplete({
    open: rendered,
    element: indicatorElement,
    onComplete() {
      if (!rendered()) {
        mountedAssign(false)
      }
    },
  })

  const state: RadioIndicatorState = {
    get checked() {
      return rootState.checked
    },
    get disabled() {
      return rootState.disabled
    },
    get readOnly() {
      return rootState.readOnly
    },
    get required() {
      return rootState.required
    },
    get touched() {
      return rootState.touched
    },
    get dirty() {
      return rootState.dirty
    },
    get valid() {
      return rootState.valid
    },
    get filled() {
      return rootState.filled
    },
    get focused() {
      return rootState.focused
    },
    get transitionStatus() {
      return transitionStatus()
    },
  }

  const shouldRender = () => Boolean(local.keepMounted) || mounted()

  return (
    <Show when={shouldRender()}>
      {createRender<RadioIndicatorState, Record<string, unknown>>({
        defaultElement: 'span',
        state,
        render: local.render,
        stateAttributesMapping,
        ref: [
          local.ref,
          (el: Element | null) => {
            indicatorElementAssign(el as HTMLSpanElement | null)
          },
        ],
        props: mergeProps(elementProps as Record<string, unknown>, {
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get children() {
            return local.children
          },
          get 'data-disabled'() {
            return dataAttr(rootState.disabled)
          },
          get 'data-readonly'() {
            return dataAttr(rootState.readOnly)
          },
          get 'data-required'() {
            return dataAttr(rootState.required)
          },
          get 'data-touched'() {
            return dataAttr(rootState.touched)
          },
          get 'data-dirty'() {
            return dataAttr(rootState.dirty)
          },
          get 'data-filled'() {
            return dataAttr(rootState.filled)
          },
          get 'data-focused'() {
            return dataAttr(rootState.focused)
          },
        }),
      })}
    </Show>
  )
}

export interface RadioIndicatorState extends RadioRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus
}

export interface RadioIndicatorProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'color' | 'children'
> {
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   */
  render?: RenderProp<RadioIndicatorState, Record<string, unknown>>
  /**
   * Whether to keep the HTML element in the DOM when the radio button is inactive.
   * @default false
   */
  keepMounted?: boolean | undefined
  /**
   * Indicator contents.
   */
  children?: JSX.Element
  /**
   * Ref to the indicator element.
   */
  ref?: ((element: Element) => void) | undefined
}
