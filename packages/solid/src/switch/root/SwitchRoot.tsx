import {
  dispatchClickWithModifiers,
  visuallyHidden,
  visuallyHiddenInput,
} from '@script-augur/base-ui-utils'
import {
  Show,
  children,
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'
import { createRegisterFieldControl } from '../../internals/field-register-control/createRegisterFieldControl'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../../internals/form-context/FormContext'
import { createAriaLabelledBy } from '../../internals/labelable-provider/createAriaLabelledBy'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { NOOP } from '../../internals/noop'
import { useButton } from '../../internals/useButton'
import { dataAttr } from '../../internals/useRender'
import { stateAttributesMapping } from '../stateAttributesMapping'

import { SwitchRootContext } from './SwitchRootContext'

import type { FieldRootState } from '../../field/root/FieldRoot'
import type { BaseUIChangeEventDetails } from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Represents the switch itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 *
 * @param componentProps - Switch root props.
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Switch } from "@script-augur/base-ui-solid/switch"
 *
 * <Switch.Root defaultChecked>
 *   <Switch.Thumb />
 * </Switch.Root>
 * ```
 */
export function SwitchRoot(componentProps: SwitchRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'checked',
    'defaultChecked',
    'disabled',
    'id',
    'inputRef',
    'name',
    'form',
    'onCheckedChange',
    'readOnly',
    'required',
    'uncheckedValue',
    'value',
    'nativeButton',
    'children',
    'ref',
    'aria-labelledby',
  ])

  const { clearErrors } = useFormContext()
  const field = useFieldRootContext()
  const { labelId, controlId, registerControlId, getDescriptionProps } =
    useLabelableContext()

  const disabled = () => field.disabled() || Boolean(local.disabled)
  const name = () => field.name() ?? local.name
  const readOnly = () => local.readOnly ?? false
  const required = () => local.required ?? false
  const nativeButton = () => local.nativeButton ?? false

  const generatedId = createUniqueId()
  const id = () => generatedId

  const inputId = (): string | undefined => local.id || controlId() || undefined

  const controlRef: { current: HTMLElement | null } = { current: null }
  const [inputElement, inputElementAssign] =
    createSignal<HTMLInputElement | null>(null)
  const inputRef: { current: HTMLInputElement | null } = { current: null }
  const controlSource = Symbol()
  let hasRegistered = false

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: nativeButton,
  })

  const validation = field.validation

  const [checked, checkedAssign] = createControlled({
    value: () => local.checked,
    defaultValue: Boolean(local.defaultChecked),
  })

  // Register control id with LabelableProvider (mirrors React's useLabelableId).
  createEffect(() => {
    if (registerControlId === NOOP) return
    hasRegistered = true
    registerControlId(controlSource, inputId())
  })

  createEffect(() => {
    onCleanup(() => {
      if (!hasRegistered || registerControlId === NOOP) return
      hasRegistered = false
      registerControlId(controlSource, undefined)
    })
  })

  createRegisterFieldControl({
    controlRef,
    id,
    value: checked,
    enabled: () => !disabled(),
    name: () => local.name,
  })

  const assignInputRef = (element: HTMLInputElement | null) => {
    inputRef.current = element
    inputElementAssign(element)
    const propRef = local.inputRef
    if (typeof propRef === 'function') {
      propRef(element)
    } else if (propRef && typeof propRef === 'object') {
      propRef.current = element
    }
  }

  createEffect(() => {
    const element = inputElement()
    if (!element) return
    const cleanup = validation.registerInput(element, {
      controlRef,
      value: undefined,
    })
    onCleanup(() => {
      cleanup?.()
    })
  })

  const ariaLabelledBy = createAriaLabelledBy({
    explicitAriaLabelledBy: () => local['aria-labelledby'],
    labelId,
    labelSourceRef: inputRef,
    enableFallback: () => !nativeButton(),
    labelSourceId: () => inputId() ?? undefined,
  })

  createEffect(() => {
    const input = inputRef.current
    if (input) {
      field.filledAssign(input.checked)
    }
  })

  createEffect((prev: boolean | undefined) => {
    const next = checked()
    if (prev !== undefined && prev !== next) {
      clearErrors(name())
      field.filledAssign(next)
      field.dirtyAssign(next !== field.validityData().initialValue)
      validation.change(next)
    }
    return next
  })

  const state: SwitchRootState = {
    get checked() {
      return checked()
    },
    get disabled() {
      return disabled()
    },
    get readOnly() {
      return readOnly()
    },
    get required() {
      return required()
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

  const assignControlRef = (element: Element | null) => {
    controlRef.current = element as HTMLElement | null
  }

  const showUncheckedValue = () =>
    !checked() && Boolean(name()) && local.uncheckedValue !== undefined

  const hiddenInputId = () => (nativeButton() ? undefined : inputId())

  return (
    <SwitchRootContext.Provider value={state}>
      <SwitchRootHost
        state={state}
        render={local.render}
        class={local.class}
        style={local.style}
        elementProps={elementProps}
        ref={local.ref}
        buttonRefAssign={buttonRefAssign}
        assignControlRef={assignControlRef}
        getButtonProps={getButtonProps}
        id={id}
        inputId={inputId}
        nativeButton={nativeButton}
        checked={checked}
        readOnly={readOnly}
        required={required}
        disabled={disabled}
        ariaLabelledBy={ariaLabelledBy}
        field={field}
        validation={validation}
        getDescriptionProps={getDescriptionProps}
        inputRef={inputRef}
      >
        {local.children}
      </SwitchRootHost>

      <Show when={showUncheckedValue()}>
        <input
          type="hidden"
          form={local.form}
          name={name()}
          value={local.uncheckedValue}
          disabled={disabled()}
        />
      </Show>

      <input
        type="checkbox"
        tabIndex={-1}
        aria-hidden={true}
        ref={assignInputRef}
        checked={checked()}
        disabled={disabled()}
        form={local.form}
        name={name()}
        id={hiddenInputId() ?? undefined}
        required={required()}
        style={name() ? visuallyHiddenInput : visuallyHidden}
        {...(local.value !== undefined
          ? {
              value: local.value,
            }
          : {})}
        aria-describedby={
          validation.getValidationProps(disabled(), getDescriptionProps({}))[
            'aria-describedby'
          ] as string | undefined
        }
        aria-invalid={
          validation.getValidationProps(disabled())['aria-invalid'] as
            boolean | undefined
        }
        onChange={(event: Event & { currentTarget: HTMLInputElement }) => {
          if (event.defaultPrevented) return
          if (readOnly()) {
            event.preventDefault()
            return
          }

          const nextChecked = event.currentTarget.checked
          const details = createChangeEventDetails(REASONS.none, event)

          local.onCheckedChange?.(nextChecked, details)
          if (details.isCanceled) {
            event.currentTarget.checked = checked()
            return
          }

          checkedAssign(nextChecked)
        }}
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
        }}
        onFocus={() => {
          controlRef.current?.focus()
        }}
      />
    </SwitchRootContext.Provider>
  )
}
export interface SwitchRootState extends FieldRootState {
  /**
   * Whether the switch is currently active.
   */
  checked: boolean
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean
  /**
   * Whether the user should be unable to activate or deactivate the switch.
   */
  readOnly: boolean
  /**
   * Whether the user must activate the switch before submitting a form.
   */
  required: boolean
}
export interface SwitchRootProps extends Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'onChange' | 'value' | 'defaultChecked' | 'children' | 'color'
> {
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   */
  render?: RenderProp<SwitchRootState, Record<string, unknown>>
  /**
   * The id of the hidden input element.
   *
   * When `nativeButton` is `true`, the id is applied to the root element.
   */
  id?: string | undefined
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined
  /**
   * Identifies the form that owns the hidden input.
   * Useful when the switch is rendered outside the form.
   */
  form?: string | undefined
  /**
   * Whether the switch is currently active.
   *
   * To render an uncontrolled switch, use the `defaultChecked` prop instead.
   */
  checked?: boolean | undefined
  /**
   * Whether the switch is initially active.
   *
   * To render a controlled switch, use the `checked` prop instead.
   * @default false
   */
  defaultChecked?: boolean | undefined
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Event handler called when the switch is activated or deactivated.
   */
  onCheckedChange?:
    | ((checked: boolean, eventDetails: SwitchRootChangeEventDetails) => void)
    | undefined
  /**
   * Whether the user should be unable to activate or deactivate the switch.
   * @default false
   */
  readOnly?: boolean | undefined
  /**
   * Whether the user must activate the switch before submitting a form.
   * @default false
   */
  required?: boolean | undefined
  /**
   * A ref to access the hidden `<input>` element.
   */
  inputRef?:
    | ((element: HTMLInputElement | null) => void)
    | { current: HTMLInputElement | null }
    | undefined
  /**
   * The value submitted with the form when the switch is on.
   * By default, switch submits the "on" value, matching native checkbox behavior.
   */
  value?: string | undefined
  /**
   * The value submitted with the form when the switch is off.
   * By default, unchecked switches do not submit any value, matching native
   * checkbox behavior.
   */
  uncheckedValue?: string | undefined
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (e.g. `<div>`).
   * @default false
   */
  nativeButton?: boolean | undefined
  /**
   * Switch contents (typically {@link SwitchThumb}).
   */
  children?: JSX.Element
  /**
   * Ref to the visible control element.
   */
  ref?: ((element: Element) => void) | undefined
}
export type SwitchRootChangeEventReason = typeof REASONS.none
export type SwitchRootChangeEventDetails =
  BaseUIChangeEventDetails<SwitchRootChangeEventReason>
/**
 * Renders the visible switch host under {@link SwitchRootContext} so Thumb
 * children see the provider, while `children()` prevents `data-*` attribute
 * updates from remounting the thumb.
 */
function SwitchRootHost(props: {
  state: SwitchRootState
  render: SwitchRootProps['render']
  class: SwitchRootProps['class']
  style: SwitchRootProps['style']
  elementProps: Record<string, unknown>
  ref: SwitchRootProps['ref']
  buttonRefAssign: (element: HTMLElement | null) => void
  assignControlRef: (element: Element | null) => void
  getButtonProps: (
    externalProps?: Record<string, unknown>
  ) => Record<string, unknown>
  id: () => string
  inputId: () => string | undefined
  nativeButton: () => boolean
  checked: () => boolean
  readOnly: () => boolean
  required: () => boolean
  disabled: () => boolean
  ariaLabelledBy: () => string | undefined
  field: ReturnType<typeof useFieldRootContext>
  validation: ReturnType<typeof useFieldRootContext>['validation']
  getDescriptionProps: ReturnType<
    typeof useLabelableContext
  >['getDescriptionProps']
  inputRef: { current: HTMLInputElement | null }
  children?: JSX.Element
}): JSX.Element {
  const resolvedChildren = children(() => props.children)

  return createRender<SwitchRootState, Record<string, unknown>>({
    defaultElement: 'span',
    state: props.state,
    render: props.render,
    stateAttributesMapping,
    props: mergeProps(
      // Events only — getButtonProps spreads external props and would freeze getters.
      props.getButtonProps({
        onFocus() {
          if (!props.disabled()) {
            props.field.focusedAssign(true)
          }
        },
        onBlur() {
          const inputEl = props.inputRef.current
          if (!inputEl || props.disabled()) {
            return
          }
          props.field.touchedAssign(true)
          props.field.focusedAssign(false)
          if (props.field.validationMode() === 'onBlur') {
            void props.validation.commit(inputEl.checked)
          }
        },
        onClick(event: MouseEvent) {
          if (props.readOnly() || props.disabled()) {
            return
          }
          event.preventDefault()
          const input = props.inputRef.current
          if (!input) {
            return
          }
          dispatchClickWithModifiers(input, event)
        },
      }),
      {
        ref(element: HTMLElement) {
          props.buttonRefAssign(element)
          props.assignControlRef(element)
          const userRef = props.ref
          if (typeof userRef === 'function') {
            userRef(element)
          }
        },
        get id() {
          return props.nativeButton()
            ? (props.inputId() ?? undefined)
            : props.id()
        },
        role: 'switch',
        get 'aria-checked'() {
          return props.checked()
        },
        get 'aria-readonly'() {
          return props.readOnly() || undefined
        },
        get 'aria-required'() {
          return props.required() || undefined
        },
        get 'aria-labelledby'() {
          return props.ariaLabelledBy()
        },
        get 'data-disabled'() {
          return dataAttr(props.disabled())
        },
        get 'data-readonly'() {
          return dataAttr(props.readOnly())
        },
        get 'data-required'() {
          return dataAttr(props.required())
        },
        get 'data-touched'() {
          return dataAttr(props.field.state.touched)
        },
        get 'data-dirty'() {
          return dataAttr(props.field.state.dirty)
        },
        get 'data-filled'() {
          return dataAttr(props.field.state.filled)
        },
        get 'data-focused'() {
          return dataAttr(props.field.state.focused)
        },
        get class() {
          return props.class
        },
        get style() {
          return props.style
        },
        get children() {
          return resolvedChildren()
        },
      },
      // Consumer props so they can override built-ins (e.g. role="checkbox").
      props.elementProps,
      // Validation / description attrs last so Field.Description merges with
      // consumer `aria-describedby` (matches React getValidationProps order).
      // getValidationProps already applies getDescriptionProps.
      {
        get 'aria-describedby'() {
          const external = props.elementProps['aria-describedby']
          return props.validation.getValidationProps(
            props.disabled(),
            external != null ? { 'aria-describedby': external } : {}
          )['aria-describedby']
        },
        get 'aria-invalid'() {
          return props.validation.getValidationProps(props.disabled())[
            'aria-invalid'
          ]
        },
      }
    ),
  })
}
