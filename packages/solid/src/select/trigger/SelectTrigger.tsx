import { mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { useButton } from '../../internals/useButton'
import { useSelectRootContext } from '../root/SelectRootContext'
import { selectTriggerStateAttributesMapping } from '../utils/stateAttributesMapping'

import { SelectTriggerDataAttributes } from './SelectTriggerDataAttributes'

import type { FieldRootState } from '../../field/root/FieldRoot'
import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * A button that opens the select popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function SelectTrigger(componentProps: SelectTriggerProps): JSX.Element {
  const context = useSelectRootContext()
  const field = useFieldRootContext()
  const { getDescriptionProps } = useLabelableContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'id',
    'ref',
  ])

  const disabled = () =>
    field.disabled() || context.disabled() || Boolean(local.disabled)

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  const id = () => local.id ?? context.id()

  function toggleOpen(event: Event) {
    if (disabled() || context.readOnly()) return
    const next = !context.open()
    context.setOpen(next, createChangeEventDetails(REASONS.triggerPress, event))
  }

  const state: SelectTriggerState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return context.open()
    },
    get readOnly() {
      return context.readOnly()
    },
    get value() {
      return context.value()
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

  return createRender<SelectTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      selectTriggerStateAttributesMapping as StateAttributesMapping<SelectTriggerState>,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          onMouseDown(event: MouseEvent) {
            // Pointer path — matches Floating UI useClick `event: 'mousedown'`.
            if (event.button !== 0) return
            toggleOpen(event)
          },
          onClick(event: MouseEvent) {
            // Keyboard Enter/Space synthesizes `click` with `detail === 0` and
            // no preceding mousedown. Pointer clicks already toggled above —
            // skip them to avoid double-toggle.
            if (event.detail !== 0) return
            toggleOpen(event)
          },
          onFocus() {
            field.focusedAssign(true)
          },
          onBlur(event: FocusEvent) {
            if (
              context.positionerElement() != null &&
              (event.relatedTarget == null ||
                !context
                  .positionerElement()
                  ?.contains(event.relatedTarget as Node))
            ) {
              field.touchedAssign(true)
              field.focusedAssign(false)
              if (field.validationMode() === 'onBlur') {
                void field.validation.commit(context.value())
              }
            }
          },
        }) as Record<string, unknown>
      ),
      {
        get id() {
          return id()
        },
        role: 'combobox',
        get 'aria-expanded'() {
          return context.open()
        },
        'aria-haspopup': 'listbox' as const,
        get 'aria-controls'() {
          return context.open()
            ? (context.listElement()?.id ?? undefined)
            : undefined
        },
        get 'aria-labelledby'() {
          return context.labelId()
        },
        get 'aria-readonly'() {
          return context.readOnly() || undefined
        },
        get 'aria-required'() {
          return context.required() || undefined
        },
        get tabIndex() {
          return disabled() ? -1 : 0
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get [SelectTriggerDataAttributes.popupOpen]() {
          return context.open() ? '' : undefined
        },
        ref(element: HTMLElement) {
          buttonRefAssign(element)
          context.triggerElementAssign(element)
          const userRef = local.ref
          if (typeof userRef === 'function') {
            userRef(element as HTMLButtonElement)
          }
        },
      },
      // Validation / description attrs last (matches FieldControl / Radio merge order).
      {
        get 'aria-describedby'() {
          const external = (elementProps as Record<string, unknown>)[
            'aria-describedby'
          ]
          return field.validation.getValidationProps(
            disabled(),
            getDescriptionProps(
              external != null ? { 'aria-describedby': external } : {}
            )
          )['aria-describedby']
        },
        get 'aria-invalid'() {
          return field.validation.getValidationProps(disabled())['aria-invalid']
        },
      }
    ),
  })
}

/** Public state for {@link SelectTrigger}. */
export interface SelectTriggerState extends FieldRootState {
  open: boolean
  readOnly: boolean
  value: unknown
}

/** Props for {@link SelectTrigger}. */
export type SelectTriggerProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  render?: RenderProp<SelectTriggerState, Record<string, unknown>>
}
