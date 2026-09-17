import {
  dispatchClickWithModifiers,
  getDefaultFormSubmitter,
  ownerWindow,
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

import { useFieldItemContext } from '../../field/item/FieldItemContext'
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
import { makeEventPreventable } from '../../internals/makeEventPreventable'
import { NOOP } from '../../internals/noop'
import { useButton } from '../../internals/useButton'
import { dataAttr } from '../../internals/useRender'
import { getCheckboxStateAttributesMapping } from '../utils/getCheckboxStateAttributesMapping'
import { useCheckboxGroupContext } from '../utils/useCheckboxGroupContext'

import { CheckboxRootContext } from './CheckboxRootContext'

import type { FieldRootState } from '../../field/root/FieldRoot'
import type { BaseUIChangeEventDetails } from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'
/** Attribute set on parent checkboxes within a Checkbox Group. */
export const PARENT_CHECKBOX = 'data-parent'
/**
 * Represents the checkbox itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 *
 * @param componentProps - Checkbox root props.
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Checkbox } from "@script-augur/base-ui-solid/checkbox"
 *
 * <Checkbox.Root defaultChecked>
 *   <Checkbox.Indicator>✓</Checkbox.Indicator>
 * </Checkbox.Root>
 * ```
 */
export function CheckboxRoot(componentProps: CheckboxRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'checked',
    'defaultChecked',
    'disabled',
    'id',
    'indeterminate',
    'inputRef',
    'name',
    'form',
    'onCheckedChange',
    'parent',
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
  const fieldItemContext = useFieldItemContext()
  const { labelId, controlId, registerControlId, getDescriptionProps } =
    useLabelableContext()

  const groupContext = useCheckboxGroupContext()
  const parentContext = () =>
    groupContext?.allValues() === undefined ? undefined : groupContext.parent
  const isGroupedWithParent = () => parentContext() !== undefined

  const disabled = () =>
    field.disabled() ||
    fieldItemContext.disabled() ||
    Boolean(groupContext?.disabled()) ||
    Boolean(local.disabled)

  const name = () => field.name() ?? local.name
  // Identity within a group: explicit `value`, else `name`.
  const groupItemValue = () => local.value ?? local.name
  const parent = () => local.parent ?? false
  const readOnly = () => local.readOnly ?? false
  const required = () => local.required ?? false
  const indeterminate = () => local.indeterminate ?? false
  const nativeButton = () => local.nativeButton ?? false

  const generatedId = createUniqueId()
  const generatedInputId = createUniqueId()
  const id = () => generatedId

  const groupProps = () => {
    const parentCtx = parentContext()
    if (!parentCtx) {
      return {} as {
        checked?: boolean
        indeterminate?: boolean
        onCheckedChange?: (
          checked: boolean,
          eventDetails: CheckboxRootChangeEventDetails
        ) => void
        id?: string
        'aria-controls'?: string
      }
    }
    if (parent()) {
      return parentCtx.getParentProps()
    }
    const itemValue = groupItemValue()
    if (itemValue !== undefined) {
      return parentCtx.getChildProps(itemValue)
    }
    return {}
  }

  const groupChecked = () => groupProps().checked ?? local.checked
  const groupIndeterminate = () => {
    const props = groupProps()
    if ('indeterminate' in props && props.indeterminate !== undefined) {
      return props.indeterminate
    }
    return indeterminate()
  }
  const groupOnChange = () => groupProps().onCheckedChange
  const otherGroupProps = () => {
    const props = groupProps()
    return {
      get id() {
        return 'id' in props ? props.id : undefined
      },
      get 'aria-controls'() {
        return 'aria-controls' in props ? props['aria-controls'] : undefined
      },
    }
  }

  const inputId = (): string | undefined => {
    if (isGroupedWithParent()) {
      if (parent()) {
        return generatedInputId
      }
      const itemValue = groupItemValue()
      if (itemValue !== undefined) {
        return `${parentContext()!.id}-${itemValue}`
      }
      return local.id || controlId() || generatedInputId
    }
    return local.id || controlId() || undefined
  }

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

  const validation = () => groupContext?.validation ?? field.validation

  const [checked, checkedAssign] = createControlled({
    value: () => {
      const itemValue = groupItemValue()
      const groupValue = groupContext?.value()
      if (itemValue !== undefined && groupValue !== undefined && !parent()) {
        return groupValue.includes(itemValue)
      }
      return groupChecked()
    },
    defaultValue: local.defaultChecked ?? false,
  })

  const computedChecked = () =>
    isGroupedWithParent() ? Boolean(groupChecked()) : checked()
  const computedIndeterminate = () =>
    isGroupedWithParent()
      ? Boolean(groupIndeterminate() || indeterminate())
      : indeterminate()

  // Register control id with LabelableProvider (mirrors React's manual path).
  createEffect(() => {
    if (registerControlId === NOOP) {
      return
    }
    hasRegistered = true
    registerControlId(controlSource, inputId())
  })

  createEffect(() => {
    onCleanup(() => {
      if (!hasRegistered || registerControlId === NOOP) {
        return
      }
      hasRegistered = false
      registerControlId(controlSource, undefined)
    })
  })

  createRegisterFieldControl({
    controlRef,
    id,
    value: checked,
    enabled: () => !groupContext && !disabled(),
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
    if (!element || parent()) {
      return
    }
    const registeredInputValue = groupContext ? groupItemValue() : undefined
    const cleanup = validation().registerInput(element, {
      controlRef,
      value: registeredInputValue,
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
      input.indeterminate = computedIndeterminate()
      if (checked()) {
        field.filledAssign(true)
      }
    }
  })

  createEffect((prev: boolean | undefined) => {
    const next = checked()
    if (prev !== undefined && prev !== next) {
      if (groupContext) {
        return next
      }
      clearErrors(name())
      field.filledAssign(next)
      field.dirtyAssign(next !== field.validityData().initialValue)
      validation().change(next)
    }
    return next
  })

  createEffect(() => {
    const parentCtx = parentContext()
    const itemValue = groupItemValue()
    if (!parentCtx || itemValue === undefined) {
      return
    }
    parentCtx.disabledStatesRef.set(itemValue, disabled())
    onCleanup(() => {
      parentCtx.disabledStatesRef.delete(itemValue)
    })
  })

  const state: CheckboxRootState = {
    get checked() {
      return computedChecked()
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
    get indeterminate() {
      return computedIndeterminate()
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

  const stateAttributesMapping = getCheckboxStateAttributesMapping(state)

  const assignControlRef = (element: Element | null) => {
    controlRef.current = element as HTMLElement | null
  }

  const showUncheckedValue = () =>
    !checked() &&
    !groupContext &&
    Boolean(name()) &&
    !parent() &&
    local.uncheckedValue !== undefined

  const commitValue = () =>
    groupContext ? groupContext.value() : Boolean(inputRef.current?.checked)

  return (
    <CheckboxRootContext.Provider value={state}>
      <CheckboxRootHost
        state={state}
        stateAttributesMapping={stateAttributesMapping}
        render={local.render}
        class={local.class}
        style={local.style}
        elementProps={elementProps}
        otherGroupProps={otherGroupProps}
        ref={local.ref}
        buttonRefAssign={buttonRefAssign}
        assignControlRef={assignControlRef}
        getButtonProps={getButtonProps}
        id={id}
        inputId={inputId}
        nativeButton={nativeButton}
        computedChecked={computedChecked}
        computedIndeterminate={computedIndeterminate}
        readOnly={readOnly}
        required={required}
        disabled={disabled}
        parent={parent}
        ariaLabelledBy={ariaLabelledBy}
        field={field}
        validation={validation}
        commitValue={commitValue}
        inputRef={inputRef}
      >
        {local.children}
      </CheckboxRootHost>
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
        name={parent() ? undefined : name()}
        id={nativeButton() ? undefined : (inputId() ?? undefined)}
        required={required()}
        style={name() ? visuallyHiddenInput : visuallyHidden}
        {...(local.value !== undefined
          ? {
              value:
                (groupContext ? checked() && local.value : local.value) || '',
            }
          : {})}
        aria-describedby={
          validation().getValidationProps(disabled(), getDescriptionProps({}))[
            'aria-describedby'
          ] as string | undefined
        }
        aria-invalid={
          validation().getValidationProps(disabled())['aria-invalid'] as
            boolean | undefined
        }
        onChange={(event: Event & { currentTarget: HTMLInputElement }) => {
          if (event.defaultPrevented) {
            return
          }
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

          groupOnChange()?.(nextChecked, details)
          // Getter can flip after groupOnChange; eslint cannot track that.
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- cancelable details
          if (details.isCanceled) {
            event.currentTarget.checked = checked()
            return
          }

          checkedAssign(nextChecked)

          const itemValue = groupItemValue()
          if (
            itemValue !== undefined &&
            groupContext !== undefined &&
            !parent() &&
            !isGroupedWithParent()
          ) {
            const nextGroupValue = nextChecked
              ? [...groupContext.value(), itemValue]
              : groupContext.value().filter(item => item !== itemValue)
            groupContext.setValue(nextGroupValue, details)
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- cancelable details
            if (details.isCanceled) {
              event.currentTarget.checked = checked()
            }
          }
        }}
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
        }}
        onFocus={() => {
          controlRef.current?.focus()
        }}
      />
    </CheckboxRootContext.Provider>
  )
}
export interface CheckboxRootState extends FieldRootState {
  /**
   * Whether the checkbox is currently ticked.
   */
  checked: boolean
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean
  /**
   * Whether the user should be unable to tick or untick the checkbox.
   */
  readOnly: boolean
  /**
   * Whether the user must tick the checkbox before submitting a form.
   */
  required: boolean
  /**
   * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
   */
  indeterminate: boolean
}
export interface CheckboxRootProps extends Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'onChange' | 'value' | 'defaultChecked' | 'children' | 'color'
> {
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   */
  render?: RenderProp<CheckboxRootState, Record<string, unknown>>
  /**
   * The id of the input element.
   */
  id?: string | undefined
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined
  /**
   * Identifies the form that owns the hidden input.
   * Useful when the checkbox is rendered outside the form.
   */
  form?: string | undefined
  /**
   * Whether the checkbox is currently ticked.
   *
   * To render an uncontrolled checkbox, use the `defaultChecked` prop instead.
   */
  checked?: boolean | undefined
  /**
   * Whether the checkbox is initially ticked.
   *
   * To render a controlled checkbox, use the `checked` prop instead.
   * @default false
   */
  defaultChecked?: boolean | undefined
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Event handler called when the checkbox is ticked or unticked.
   */
  onCheckedChange?:
    | ((checked: boolean, eventDetails: CheckboxRootChangeEventDetails) => void)
    | undefined
  /**
   * Whether the user should be unable to tick or untick the checkbox.
   * @default false
   */
  readOnly?: boolean | undefined
  /**
   * Whether the user must tick the checkbox before submitting a form.
   * @default false
   */
  required?: boolean | undefined
  /**
   * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
   * @default false
   */
  indeterminate?: boolean | undefined
  /**
   * A ref to access the hidden `<input>` element.
   */
  inputRef?:
    | ((element: HTMLInputElement | null) => void)
    | { current: HTMLInputElement | null }
    | undefined
  /**
   * Whether the checkbox controls a group of child checkboxes.
   *
   * Must be used in a [Checkbox Group](https://base-ui.com/react/components/checkbox-group).
   * @default false
   */
  parent?: boolean | undefined
  /**
   * The value submitted with the form when the checkbox is unchecked.
   * By default, unchecked checkboxes do not submit any value, matching native
   * checkbox behavior.
   */
  uncheckedValue?: string | undefined
  /**
   * The checkbox's value. Identifies it within a Checkbox Group, falling back
   * to `name` when omitted. When submitting a form, a checked box submits
   * `value`; with no `value`, it submits the native "on".
   */
  value?: string | undefined
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (e.g. `<div>`).
   * @default false
   */
  nativeButton?: boolean | undefined
  /**
   * Checkbox contents (typically {@link CheckboxIndicator}).
   */
  children?: JSX.Element
  /**
   * Ref to the visible control element.
   */
  ref?: ((element: Element) => void) | undefined
}
export type CheckboxRootChangeEventReason = typeof REASONS.none
export type CheckboxRootChangeEventDetails =
  BaseUIChangeEventDetails<CheckboxRootChangeEventReason>
/**
 * Renders the visible checkbox host under {@link CheckboxRootContext} so
 * Indicator children see the provider, while `children()` prevents `data-*`
 * attribute updates from remounting the indicator.
 */
function CheckboxRootHost(props: {
  state: CheckboxRootState
  stateAttributesMapping: ReturnType<typeof getCheckboxStateAttributesMapping>
  render: CheckboxRootProps['render']
  class: CheckboxRootProps['class']
  style: CheckboxRootProps['style']
  elementProps: Record<string, unknown>
  otherGroupProps: () => {
    id?: string | undefined
    'aria-controls'?: string | undefined
  }
  ref: CheckboxRootProps['ref']
  buttonRefAssign: (element: HTMLElement | null) => void
  assignControlRef: (element: Element | null) => void
  getButtonProps: (
    externalProps?: Record<string, unknown>
  ) => Record<string, unknown>
  id: () => string
  inputId: () => string | undefined
  nativeButton: () => boolean
  computedChecked: () => boolean
  computedIndeterminate: () => boolean
  readOnly: () => boolean
  required: () => boolean
  disabled: () => boolean
  parent: () => boolean
  ariaLabelledBy: () => string | undefined
  field: ReturnType<typeof useFieldRootContext>
  validation: () => ReturnType<typeof useFieldRootContext>['validation']
  commitValue: () => unknown
  inputRef: { current: HTMLInputElement | null }
  children?: JSX.Element
}): JSX.Element {
  const resolvedChildren = children(() => props.children)

  return createRender<CheckboxRootState, Record<string, unknown>>({
    defaultElement: 'span',
    state: props.state,
    render: props.render,
    stateAttributesMapping: props.stateAttributesMapping,
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
          if (!inputEl) {
            return
          }
          props.field.touchedAssign(true)
          props.field.focusedAssign(false)
          if (props.field.validationMode() === 'onBlur') {
            void props.validation().commit(props.commitValue())
          }
        },
        onKeyDown(event: KeyboardEvent & { currentTarget: HTMLElement }) {
          if (event.key !== 'Enter') {
            return
          }

          const baseUIEvent = makeEventPreventable(event)
          baseUIEvent.preventBaseUIHandler()

          if (event.defaultPrevented) {
            return
          }

          const formToSubmit = props.inputRef.current?.form ?? null
          const currentTarget = event.currentTarget
          const originalPreventDefault = event.preventDefault.bind(event)
          let preventDefaultCalledAfterPropagation = false

          event.preventDefault = () => {
            preventDefaultCalledAfterPropagation = true
            originalPreventDefault()
          }

          originalPreventDefault()

          ownerWindow(currentTarget).queueMicrotask(() => {
            event.preventDefault = originalPreventDefault
            if (!preventDefaultCalledAfterPropagation) {
              getDefaultFormSubmitter(formToSubmit)?.click()
            }
          })
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
        role: 'checkbox',
        get 'aria-checked'() {
          return props.computedIndeterminate()
            ? 'mixed'
            : props.computedChecked()
              ? 'true'
              : 'false'
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
        get [PARENT_CHECKBOX]() {
          return props.parent() ? '' : undefined
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
        get 'data-indeterminate'() {
          return dataAttr(props.computedIndeterminate())
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
      // Consumer props before composed a11y so they can override built-ins
      // (e.g. role="switch") without clobbering Field description/validation.
      props.elementProps,
      // Parent select-all linkage after elementProps (match upstream) so
      // consumers cannot clobber group `id` / `aria-controls`.
      {
        get id() {
          return props.otherGroupProps().id
        },
        get 'aria-controls'() {
          return props.otherGroupProps()['aria-controls']
        },
      },
      {
        // Match FieldControl / upstream: compose after elementProps.
        // getValidationProps already applies getDescriptionProps.
        get 'aria-describedby'() {
          const external = props.elementProps['aria-describedby']
          return props
            .validation()
            .getValidationProps(
              props.disabled(),
              external != null ? { 'aria-describedby': external } : {}
            )['aria-describedby']
        },
        get 'aria-invalid'() {
          return props.validation().getValidationProps(props.disabled())[
            'aria-invalid'
          ]
        },
      }
    ),
  })
}
