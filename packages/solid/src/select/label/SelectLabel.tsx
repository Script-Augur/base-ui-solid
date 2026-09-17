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
import { useSelectRootContext } from '../root/SelectRootContext'

import type { FieldRootState } from '../../field/root/FieldRoot'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An accessible label that is automatically associated with the select trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Label props.
 * @returns A Solid JSX element.
 */
export function SelectLabel(componentProps: SelectLabelProps): JSX.Element {
  const context = useSelectRootContext()
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
  const id = () => local.id ?? `base-ui-select-${generatedId}-label`

  createRenderEffect(() => {
    const nextId = id()
    context.labelIdAssign(nextId)
    onCleanup(() => {
      context.labelIdAssign(prev => (prev === nextId ? undefined : prev))
    })
  })

  return createRender<SelectLabelState, Record<string, unknown>>({
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
        context.triggerElement()?.focus()
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

/** Public state for {@link SelectLabel}. */
export type SelectLabelState = FieldRootState

/** Props for {@link SelectLabel}. */
export type SelectLabelProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'id'
> & {
  id?: string
  render?: RenderProp<SelectLabelState, Record<string, unknown>>
}
