import { mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { useComboboxRootContext } from '../root/ComboboxRootContext'
import { comboboxTriggerStateAttributesMapping } from '../utils/stateAttributesMapping'

import { ComboboxInputDataAttributes } from './ComboboxInputDataAttributes'

import type { FieldRootState } from '../../field/root/FieldRoot'
import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Input props.
 * @returns A Solid JSX element.
 */
export function ComboboxInput(componentProps: ComboboxInputProps): JSX.Element {
  const context = useComboboxRootContext()
  const field = useFieldRootContext()
  const { getDescriptionProps } = useLabelableContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'id',
    'ref',
    'onInput',
    'onClick',
    'onKeyDown',
  ])

  const disabled = () =>
    field.disabled() || context.disabled() || Boolean(local.disabled)

  const id = () => local.id ?? context.id()

  function openFromInput(event: Event) {
    if (disabled() || context.readOnly() || context.open()) return
    context.setOpen(true, createChangeEventDetails(REASONS.inputPress, event))
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (disabled() || context.readOnly()) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!context.open()) {
        context.setOpen(
          true,
          createChangeEventDetails(REASONS.listNavigation, event)
        )
      }
      return
    }

    if (event.key === 'Enter' && context.open()) {
      const list = context.listElement()
      const highlighted =
        list?.querySelector<HTMLElement>('[data-highlighted]') ??
        list?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')
      if (highlighted) {
        event.preventDefault()
        highlighted.click()
      }
    }
  }

  const state: ComboboxInputState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return context.open()
    },
    get readOnly() {
      return context.readOnly()
    },
    get listEmpty() {
      return context.listEmpty()
    },
    get popupSide() {
      return null
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

  return createRender<ComboboxInputState, Record<string, unknown>>({
    defaultElement: 'input',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      comboboxTriggerStateAttributesMapping as StateAttributesMapping<ComboboxInputState>,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return id()
      },
      role: 'combobox',
      type: 'text',
      get value() {
        return context.inputValue()
      },
      get disabled() {
        return disabled() || undefined
      },
      get readOnly() {
        return context.readOnly() || undefined
      },
      get 'aria-expanded'() {
        return context.open()
      },
      'aria-haspopup': 'listbox' as const,
      'aria-autocomplete': 'list' as const,
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
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get [ComboboxInputDataAttributes.popupOpen]() {
        return context.open() ? '' : undefined
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
              ?.contains(event.relatedTarget as Node)) &&
          event.relatedTarget !== context.triggerElement()
        ) {
          field.touchedAssign(true)
          field.focusedAssign(false)
          if (field.validationMode() === 'onBlur') {
            void field.validation.commit(context.value())
          }
        }
      },
      onClick(event: MouseEvent) {
        if (context.openOnInputClick()) {
          openFromInput(event)
        }
        const user = local.onClick
        if (typeof user === 'function') {
          user(event as never)
        }
      },
      onInput(event: InputEvent & { currentTarget: HTMLInputElement }) {
        if (disabled() || context.readOnly()) return
        const next = event.currentTarget.value
        context.setInputValue(
          next,
          createChangeEventDetails(REASONS.inputChange, event)
        )
        if (!context.open()) {
          context.setOpen(
            true,
            createChangeEventDetails(REASONS.inputChange, event)
          )
        }
        const user = local.onInput
        if (typeof user === 'function') {
          user(event as never)
        }
      },
      onKeyDown(event: KeyboardEvent) {
        handleKeyDown(event)
        const user = local.onKeyDown
        if (typeof user === 'function') {
          user(event as never)
        }
      },
      ref(element: HTMLElement) {
        context.inputElementAssign(element as HTMLInputElement)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLInputElement)
        }
      },
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
    }),
  })
}

/** Public state for {@link ComboboxInput}. */
export interface ComboboxInputState extends FieldRootState {
  open: boolean
  readOnly: boolean
  listEmpty: boolean
  popupSide: string | null
}

/** Props for {@link ComboboxInput}. */
export type ComboboxInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'disabled'
> & {
  disabled?: boolean
  render?: RenderProp<ComboboxInputState, Record<string, unknown>>
}
