import {
  createEffect,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { fieldValidityMapping } from '../../internals/field-constants/constants'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { useFieldItemContext } from '../item/FieldItemContext'

import type { RenderProp } from '../../internals/createRender'
import type { FieldRootState } from '../root/FieldRoot'
import type { JSX } from 'solid-js'

/**
 * A paragraph with additional information about the field.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldDescription(
  componentProps: FieldDescriptionProps
): JSX.Element {
  const field = useFieldRootContext(false)
  const fieldItem = useFieldItemContext()
  const { messageIdsAssign } = useLabelableContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'ref',
  ])

  const generatedId = createUniqueId()
  const id = () => (local.id !== undefined ? local.id : generatedId)

  const state: FieldDescriptionState = {
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

  createEffect(() => {
    const currentId = id()
    if (!currentId) {
      return
    }

    messageIdsAssign(v => v.concat(currentId))
    onCleanup(() => {
      messageIdsAssign(v => v.filter(item => item !== currentId))
    })
  })

  return createRender<FieldDescriptionState, Record<string, unknown>>({
    defaultElement: 'p',
    state,
    render: local.render,
    stateAttributesMapping: fieldValidityMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return id() || undefined
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      ref: local.ref,
    }),
  })
}

export interface FieldDescriptionState extends FieldRootState {}

export type FieldDescriptionProps = JSX.HTMLAttributes<HTMLParagraphElement> & {
  render?: RenderProp<FieldDescriptionState, Record<string, unknown>>
}
