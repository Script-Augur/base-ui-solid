import { Show, createSignal, mergeProps, splitProps } from 'solid-js'

import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createRender } from '../../internals/createRender'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { transitionStatusMapping } from '../../internals/stateAttributesMapping'
import { dataAttr } from '../../internals/useRender'
import { useCheckboxRootContext } from '../root/CheckboxRootContext'
import { getCheckboxStateAttributesMapping } from '../utils/getCheckboxStateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { CheckboxRootState } from '../root/CheckboxRoot'
import type { JSX } from 'solid-js'

/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 *
 * @param componentProps - Indicator props (`keepMounted`, `render`, …).
 * @returns A Solid JSX element.
 */
export function CheckboxIndicator(
  componentProps: CheckboxIndicatorProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'keepMounted',
    'children',
    'ref',
  ])

  const rootState = useCheckboxRootContext()
  const rendered = () => rootState.checked || rootState.indeterminate

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

  const state: CheckboxIndicatorState = {
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
    get indeterminate() {
      return rootState.indeterminate
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

  const baseStateAttributesMapping =
    getCheckboxStateAttributesMapping(rootState)
  const stateAttributesMapping = {
    ...baseStateAttributesMapping,
    ...transitionStatusMapping,
  } as StateAttributesMapping<CheckboxIndicatorState & Record<string, unknown>>

  const shouldRender = () => Boolean(local.keepMounted) || mounted()

  return (
    <Show when={shouldRender()}>
      {createRender<CheckboxIndicatorState, Record<string, unknown>>({
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
          get 'data-indeterminate'() {
            return dataAttr(rootState.indeterminate)
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

export interface CheckboxIndicatorState extends CheckboxRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus
}

export interface CheckboxIndicatorProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'color' | 'children'
> {
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   */
  render?: RenderProp<CheckboxIndicatorState, Record<string, unknown>>
  /**
   * Whether to keep the element in the DOM when the checkbox is not checked.
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
