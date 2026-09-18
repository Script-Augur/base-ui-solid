import { mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useButton } from '../../internals/useButton'
import { useComboboxRootContext } from '../root/ComboboxRootContext'
import { comboboxTriggerStateAttributesMapping } from '../utils/stateAttributesMapping'

import { ComboboxTriggerDataAttributes } from './ComboboxTriggerDataAttributes'

import type { FieldRootState } from '../../field/root/FieldRoot'
import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * A button that opens the combobox popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function ComboboxTrigger(
  componentProps: ComboboxTriggerProps
): JSX.Element {
  const context = useComboboxRootContext()
  const field = useFieldRootContext()

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

  function toggleOpen(event: Event) {
    if (disabled() || context.readOnly()) return
    const next = !context.open()
    context.setOpen(next, createChangeEventDetails(REASONS.triggerPress, event))
  }

  const hasValue = () => {
    const current = context.value()
    if (context.multiple()) {
      return Array.isArray(current) && current.length > 0
    }
    return current != null
  }

  const state: ComboboxTriggerState = {
    get disabled() {
      return disabled()
    },
    get open() {
      return context.open()
    },
    get listEmpty() {
      return context.listEmpty()
    },
    get placeholder() {
      return !hasValue()
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

  return createRender<ComboboxTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      comboboxTriggerStateAttributesMapping as StateAttributesMapping<ComboboxTriggerState>,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          type: 'button',
          onMouseDown(event: MouseEvent) {
            if (event.button !== 0) return
            toggleOpen(event)
          },
          onClick(event: MouseEvent) {
            if (event.detail !== 0) return
            toggleOpen(event)
          },
        }) as Record<string, unknown>
      ),
      {
        get id() {
          return local.id
        },
        get 'aria-expanded'() {
          return context.open()
        },
        'aria-haspopup': 'listbox' as const,
        get 'aria-controls'() {
          return context.open()
            ? (context.listElement()?.id ?? undefined)
            : undefined
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
        get [ComboboxTriggerDataAttributes.popupOpen]() {
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
      }
    ),
  })
}

/** Public state for {@link ComboboxTrigger}. */
export interface ComboboxTriggerState extends FieldRootState {
  open: boolean
  listEmpty: boolean
  placeholder: boolean
  popupSide: string | null
}

/** Props for {@link ComboboxTrigger}. */
export type ComboboxTriggerProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  render?: RenderProp<ComboboxTriggerState, Record<string, unknown>>
}
