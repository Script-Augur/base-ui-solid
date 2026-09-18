import {
  createRenderEffect,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { fieldValidityMapping } from '../../internals/field-constants/constants'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useComboboxRootContext } from '../root/ComboboxRootContext'

import type { FieldRootState } from '../../field/root/FieldRoot'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An accessible label that is automatically associated with the combobox trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Label props.
 * @returns A Solid JSX element.
 */
export function ComboboxLabel(componentProps: ComboboxLabelProps): JSX.Element {
  const context = useComboboxRootContext()
  const field = useFieldRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'children',
    'ref',
  ])

  const generatedId = createUniqueId()
  const id = () => local.id ?? `base-ui-combobox-${generatedId}-label`

  createRenderEffect(() => {
    const nextId = id()
    context.labelIdAssign(nextId)
    onCleanup(() => {
      context.labelIdAssign(prev => (prev === nextId ? undefined : prev))
    })
  })

  return createRender<ComboboxLabelState, Record<string, unknown>>({
    defaultElement: 'div',
    state: field.state,
    render: local.render,
    stateAttributesMapping: fieldValidityMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return id()
      },
      onMouseDown(event: MouseEvent) {
        if (!event.defaultPrevented && event.detail > 1) {
          event.preventDefault()
        }
        context.inputElement()?.focus() ?? context.triggerElement()?.focus()
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      children: local.children,
      ref: local.ref,
    }),
  })
}

/** Public state for {@link ComboboxLabel}. */
export type ComboboxLabelState = FieldRootState

/** Props for {@link ComboboxLabel}. */
export type ComboboxLabelProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'id'
> & {
  id?: string
  render?: RenderProp<ComboboxLabelState, Record<string, unknown>>
}
