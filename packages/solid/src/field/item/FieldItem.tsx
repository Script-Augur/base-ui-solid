import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { fieldValidityMapping } from '../../internals/field-constants/constants'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { LabelableProvider } from '../../internals/labelable-provider'

import { FieldItemContext } from './FieldItemContext'

import type { FieldItemContextValue } from './FieldItemContext'
import type { RenderProp } from '../../internals/createRender'
import type { FieldRootState } from '../root/FieldRoot'
import type { JSX } from 'solid-js'

/**
 * Groups individual items in a checkbox group or radio group with a label and description.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldItem(componentProps: FieldItemProps): JSX.Element {
  const field = useFieldRootContext(false)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'children',
    'ref',
  ])

  const disabled = () => field.disabled() || Boolean(local.disabled)

  const state: FieldItemState = {
    get disabled() {
      return disabled()
    },
    get touched() {
      return field.state.touched
    },
    get dirty() {
      return field.state.dirty
    },
    get valid() {
      return field.state.valid
    },
    get filled() {
      return field.state.filled
    },
    get focused() {
      return field.state.focused
    },
  }

  const fieldItemContext: FieldItemContextValue = {
    disabled,
  }

  return (
    <LabelableProvider>
      <FieldItemContext.Provider value={fieldItemContext}>
        {createRender<FieldItemState, Record<string, unknown>>({
          defaultElement: 'div',
          state,
          render: local.render,
          stateAttributesMapping: fieldValidityMapping,
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
            ref: local.ref,
          }),
        })}
      </FieldItemContext.Provider>
    </LabelableProvider>
  )
}

export interface FieldItemState extends FieldRootState {}

export type FieldItemProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Whether the wrapped control should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  render?: RenderProp<FieldItemState, Record<string, unknown>>
}
