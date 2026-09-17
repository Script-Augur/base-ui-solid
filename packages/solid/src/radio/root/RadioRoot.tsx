import {
  dispatchClickWithModifiers,
  visuallyHidden,
  visuallyHiddenInput,
} from '@script-augur/base-ui-utils'
import {
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { useFieldItemContext } from '../../field/item/FieldItemContext'
import { ACTIVE_COMPOSITE_ITEM } from '../../internals/composite/constants'
import { CompositeItem } from '../../internals/composite/item/CompositeItem'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { createAriaLabelledBy } from '../../internals/labelable-provider/createAriaLabelledBy'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { NOOP } from '../../internals/noop'
import { serializeValue } from '../../internals/serializeValue'
import { useButton } from '../../internals/useButton'
import { dataAttr } from '../../internals/useRender'
import { useRadioGroupContext } from '../../radio-group/RadioGroupContext'
import { stateAttributesMapping } from '../utils/stateAttributesMapping'

import { RadioRootContext } from './RadioRootContext'

import type { FieldRootState } from '../../field/root/FieldRoot'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Represents the radio button itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 *
 * @param componentProps - Radio root props.
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Radio } from "@script-augur/base-ui-solid/radio"
 * import { RadioGroup } from "@script-augur/base-ui-solid/radio-group"
 *
 * <RadioGroup defaultValue="a">
 *   <Radio.Root value="a">
 *     <Radio.Indicator />
 *   </Radio.Root>
 * </RadioGroup>
 * ```
 */
export function RadioRoot<TValue = unknown>(
  componentProps: RadioRootProps<TValue>
): JSX.Element {
  const [local, elementProps] = splitProps(
    componentProps as RadioRootProps<unknown> & Record<string, unknown>,
    [
      'render',
      'class',
      'style',
      'disabled',
      'readOnly',
      'required',
      'aria-labelledby',
      'value',
      'inputRef',
      'nativeButton',
      'id',
      'children',
      'ref',
    ]
  )

  const groupContext = useRadioGroupContext()

  const disabledGroup = () => groupContext?.disabled()
  const readOnlyGroup = () => groupContext?.readOnly()
  const requiredGroup = () => groupContext?.required()
  const formGroup = () => groupContext?.form()
  const checkedValue = () => groupContext?.checkedValue()
  const setCheckedValue = groupContext?.setCheckedValue
  const touched = () => groupContext?.touched() ?? false
  const touchedAssign = groupContext?.touchedAssign ?? NOOP
  const registerInputRef = groupContext?.registerInputRef ?? NOOP
  const groupValidation = () => groupContext?.validation
  const groupName = () => groupContext?.name()

  const field = useFieldRootContext()
  const fieldItemContext = useFieldItemContext()
  const { labelId, controlId, registerControlId } = useLabelableContext()

  const disabled = () =>
    field.disabled() ||
    fieldItemContext.disabled() ||
    Boolean(disabledGroup()) ||
    Boolean(local.disabled)
  const readOnly = () => Boolean(readOnlyGroup()) || Boolean(local.readOnly)
  const required = () => Boolean(requiredGroup()) || Boolean(local.required)
  const form = () => formGroup()
  const nativeButton = () => local.nativeButton ?? false

  const checked = () =>
    groupContext ? Object.is(checkedValue(), local.value) : local.value === ''

  const radioRef: { current: HTMLElement | null } = { current: null }
  const inputRef: { current: HTMLInputElement | null } = { current: null }
  const [inputElement, inputElementAssign] =
    createSignal<HTMLInputElement | null>(null)

  const controlSource = Symbol()
  let hasRegistered = false
  let unregisterGroupInput: (() => void) | undefined

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: nativeButton,
    composite: () => false,
  })

  const validation = () => groupValidation() ?? field.validation

  const generatedId = createUniqueId()
  const id = () => generatedId
  const inputId = (): string | undefined => local.id || controlId() || undefined
  const hiddenInputId = () => (nativeButton() ? undefined : inputId())

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

  const ariaLabelledBy = createAriaLabelledBy({
    explicitAriaLabelledBy: () => local['aria-labelledby'],
    labelId,
    labelSourceRef: inputRef,
    enableFallback: () => !nativeButton(),
    labelSourceId: () => hiddenInputId() ?? undefined,
  })

  createEffect(() => {
    if (inputRef.current?.checked) {
      field.filledAssign(true)
    }
  })

  createEffect(() => {
    const element = inputElement()
    if (!element) {
      return
    }
    const cleanup = validation().registerInput(element, {
      controlRef: radioRef,
      value: undefined,
    })
    onCleanup(() => {
      cleanup?.()
    })
  })

  createEffect(() => {
    const input = inputElement()
    if (!input) {
      return
    }

    if (disabled() && checked()) {
      unregisterGroupInput?.()
      unregisterGroupInput = undefined
      registerInputRef(null)
      return
    }

    unregisterGroupInput?.()
    const cleanup = registerInputRef(input)
    unregisterGroupInput = typeof cleanup === 'function' ? cleanup : undefined

    onCleanup(() => {
      unregisterGroupInput?.()
      unregisterGroupInput = undefined
    })
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

  const state: RadioRootState = {
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

  const isRadioGroup = () => groupContext !== undefined

  const rootBehaviorProps = () =>
    mergeProps(
      // Events only — getButtonProps spreads external props and would freeze getters.
      getButtonProps({
        onKeyDown(event: KeyboardEvent) {
          if (event.key === 'Enter') {
            // Radio only activates with Space. Preventing the keydown's default
            // stops useButton from turning Enter into a click.
            event.preventDefault()
          }
        },
        onClick(event: MouseEvent) {
          if (event.defaultPrevented || disabled() || readOnly()) {
            return
          }
          event.preventDefault()
          const input = inputRef.current
          if (!input) {
            return
          }
          dispatchClickWithModifiers(input, event)
        },
        onFocus(event: FocusEvent) {
          if (
            event.defaultPrevented ||
            disabled() ||
            readOnly() ||
            !touched()
          ) {
            return
          }
          inputRef.current?.click()
          touchedAssign(false)
        },
      }),
      {
        role: 'radio',
        get 'aria-checked'() {
          return checked()
        },
        get 'aria-labelledby'() {
          return ariaLabelledBy()
        },
        get [ACTIVE_COMPOSITE_ITEM as string]() {
          return checked() ? '' : undefined
        },
        get id() {
          return nativeButton() ? (inputId() ?? undefined) : id()
        },
        get 'data-disabled'() {
          return dataAttr(disabled())
        },
        get 'data-readonly'() {
          return dataAttr(readOnly())
        },
        get 'data-required'() {
          return dataAttr(required())
        },
        get 'data-touched'() {
          return dataAttr(field.state.touched)
        },
        get 'data-dirty'() {
          return dataAttr(field.state.dirty)
        },
        get 'data-filled'() {
          return dataAttr(field.state.filled)
        },
        get 'data-focused'() {
          return dataAttr(field.state.focused)
        },
      },
      // Consumer props so they can override built-ins.
      elementProps as Record<string, unknown>,
      // Validation / description attrs last (matches FieldControl a11y merge order).
      {
        get 'aria-describedby'() {
          const external = (elementProps as Record<string, unknown>)[
            'aria-describedby'
          ]
          return validation().getValidationProps(
            disabled(),
            external != null ? { 'aria-describedby': external } : {}
          )['aria-describedby']
        },
        get 'aria-invalid'() {
          return validation().getValidationProps(disabled())['aria-invalid']
        },
      }
    )

  function assignHostRef(element: HTMLElement | null) {
    radioRef.current = element
    buttonRefAssign(element)
    const userRef = local.ref
    if (typeof userRef === 'function' && element) {
      userRef(element)
    }
  }

  return (
    <RadioRootContext.Provider value={state}>
      {isRadioGroup() ? (
        <CompositeItem
          tag="span"
          render={local.render}
          class={local.class}
          style={local.style}
          state={state}
          refs={[assignHostRef]}
          props={[rootBehaviorProps]}
          stateAttributesMapping={stateAttributesMapping}
        >
          {local.children}
        </CompositeItem>
      ) : (
        createRender<RadioRootState, Record<string, unknown>>({
          defaultElement: 'span',
          state,
          render: local.render,
          stateAttributesMapping,
          props: mergeProps(rootBehaviorProps(), {
            ref: assignHostRef,
            get class() {
              return local.class
            },
            get style() {
              return local.style
            },
            get children() {
              return local.children
            },
          }),
        })
      )}

      <input
        type="radio"
        tabIndex={-1}
        aria-hidden={true}
        ref={assignInputRef}
        form={form()}
        id={hiddenInputId() ?? undefined}
        name={groupName()}
        style={groupName() ? visuallyHiddenInput : visuallyHidden}
        {...(local.value !== undefined
          ? { value: serializeValue(local.value) }
          : {})}
        disabled={disabled()}
        checked={checked()}
        required={required()}
        readOnly={readOnly()}
        onChange={(event: Event & { currentTarget: HTMLInputElement }) => {
          if (event.defaultPrevented) {
            return
          }
          if (disabled() || readOnly() || local.value === undefined) {
            return
          }

          const details = createChangeEventDetails(REASONS.none, event)
          setCheckedValue?.(local.value, details)
          if (details.isCanceled) {
            return
          }
          field.touchedAssign(true)
        }}
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
        }}
        onFocus={() => {
          radioRef.current?.focus()
        }}
      />
    </RadioRootContext.Provider>
  )
}

export interface RadioRootState extends FieldRootState {
  /**
   * Whether the radio button is currently selected.
   */
  checked: boolean
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean
  /**
   * Whether the user should be unable to select the radio button.
   */
  readOnly: boolean
  /**
   * Whether the user must choose a value before submitting a form.
   */
  required: boolean
}

export interface RadioRootProps<TValue = unknown> extends Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'onChange' | 'value' | 'defaultChecked' | 'children' | 'color'
> {
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   */
  render?: RenderProp<RadioRootState, Record<string, unknown>>
  /**
   * The unique identifying value of the radio in a group.
   */
  value: TValue
  /**
   * Whether the component should ignore user interaction.
   */
  disabled?: boolean | undefined
  /**
   * Whether the user must choose a value before submitting a form.
   */
  required?: boolean | undefined
  /**
   * Whether the user should be unable to select the radio button.
   */
  readOnly?: boolean | undefined
  /**
   * A ref to access the hidden input element.
   */
  inputRef?:
    | ((element: HTMLInputElement | null) => void)
    | { current: HTMLInputElement | null }
    | undefined
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (e.g. `<div>`).
   * @default false
   */
  nativeButton?: boolean | undefined
  /**
   * The id of the hidden input element.
   *
   * When `nativeButton` is `true`, the id is applied to the root element.
   */
  id?: string | undefined
  /**
   * Radio contents (typically {@link RadioIndicator}).
   */
  children?: JSX.Element
  /**
   * Ref to the visible control element.
   */
  ref?: ((element: Element) => void) | undefined
}
