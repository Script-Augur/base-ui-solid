import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useSwitchRootContext } from '../root/SwitchRootContext'
import { stateAttributesMapping } from '../stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { SwitchRootState } from '../root/SwitchRoot'
import type { JSX } from 'solid-js'

/**
 * The movable part of the switch that indicates whether the switch is on or off.
 * Renders a `<span>`.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 *
 * @param componentProps - Thumb props (`render`, …).
 * @returns A Solid JSX element.
 */
export function SwitchThumb(componentProps: SwitchThumbProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const rootState = useSwitchRootContext()

  const state: SwitchThumbState = {
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
  }

  return createRender<SwitchThumbState, Record<string, unknown>>({
    defaultElement: 'span',
    state,
    render: local.render,
    stateAttributesMapping,
    ref: local.ref,
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
  })
}

export interface SwitchThumbState extends SwitchRootState {}

export interface SwitchThumbProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'color' | 'children'
> {
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   */
  render?: RenderProp<SwitchThumbState, Record<string, unknown>>
  /**
   * Thumb contents.
   */
  children?: JSX.Element
  /**
   * Ref to the thumb element.
   */
  ref?: ((element: Element) => void) | undefined
}
