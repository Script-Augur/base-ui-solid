import { createEffect, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { fieldValidityMapping } from '../../internals/field-constants/constants'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { createLabel } from '../../internals/labelable-provider/createLabel'
import { useFieldItemContext } from '../item/FieldItemContext'

import type { RenderProp } from '../../internals/createRender'
import type { FieldRootState } from '../root/FieldRoot'
import type { JSX } from 'solid-js'

/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldLabel(componentProps: FieldLabelProps): JSX.Element {
  const field = useFieldRootContext(false)
  const fieldItem = useFieldItemContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'nativeLabel',
    'ref',
  ])

  const nativeLabel = () => local.nativeLabel ?? true

  const state: FieldLabelState = {
    get disabled() {
      return field.disabled() || fieldItem.disabled()
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

  const labelRef: { current: HTMLElement | null } = { current: null }

  const labelProps = createLabel({
    id: () => local.id,
    native: nativeLabel,
  })

  createEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const el = labelRef.current
    if (!el) return

    const isLabelTag = el.tagName === 'LABEL'
    if (nativeLabel()) {
      if (!isLabelTag) {
        console.error(
          'Base UI: <Field.Label> expected a <label> element because the `nativeLabel` prop is true. ' +
            'Rendering a non-<label> disables native label association, so `htmlFor` will not ' +
            'work. Use a real <label> in the `render` prop, or set `nativeLabel` to `false`.'
        )
      }
    } else if (isLabelTag) {
      console.error(
        'Base UI: <Field.Label> expected a non-<label> element because the `nativeLabel` prop is false. ' +
          'Rendering a <label> assumes native label behavior while Base UI treats it as ' +
          'non-native, which can cause unexpected pointer behavior. Use a non-<label> in the ' +
          '`render` prop, or set `nativeLabel` to `true`.'
      )
    }
  })

  return createRender<FieldLabelState, Record<string, unknown>>({
    defaultElement: 'label',
    state,
    render: local.render,
    ref: [local.ref as ((el: Element) => void) | undefined, labelRef],
    stateAttributesMapping: fieldValidityMapping,
    props: [
      () => labelProps() as Record<string, unknown>,
      elementProps as Record<string, unknown>,
      {
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
      },
    ] as never,
  })
}

export interface FieldLabelState extends FieldRootState {}

export type FieldLabelProps = JSX.LabelHTMLAttributes<HTMLLabelElement> & {
  /**
   * Whether the component renders a native `<label>` element when replacing it via `render`.
   * @default true
   */
  nativeLabel?: boolean | undefined
  render?: RenderProp<FieldLabelState, Record<string, unknown>>
}
