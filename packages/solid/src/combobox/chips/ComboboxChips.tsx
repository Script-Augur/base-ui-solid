import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useComboboxRootContext } from '../root/ComboboxRootContext'

import { ComboboxChipsContext } from './ComboboxChipsContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Container for selected value chips (multiple mode).
 * Renders a `<div>` element.
 */
export function ComboboxChips(componentProps: ComboboxChipsProps): JSX.Element {
  const context = useComboboxRootContext()
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: ComboboxChipsState = {
    get disabled() {
      return context.disabled()
    },
  }

  return (
    <ComboboxChipsContext.Provider value={{}}>
      {createRender<ComboboxChipsState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
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
      })}
    </ComboboxChipsContext.Provider>
  )
}

export interface ComboboxChipsState extends Record<string, unknown> {
  disabled: boolean
}

export type ComboboxChipsProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ComboboxChipsState, Record<string, unknown>>
}
