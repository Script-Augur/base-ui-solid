import {
  children,
  createEffect,
  createSignal,
  mergeProps,
  splitProps,
} from 'solid-js'

import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext'
import { createRender } from '../../internals/createRender'
import {
  DEFAULT_VALIDITY_STATE,
  fieldValidityMapping,
} from '../../internals/field-constants/constants'
import { createFieldControlRegistration } from '../../internals/field-register-control/createFieldControlRegistration'
import { FieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../../internals/form-context/FormContext'
import { LabelableProvider } from '../../internals/labelable-provider'

import { createFieldValidation } from './createFieldValidation'

import type { RenderProp } from '../../internals/createRender'
import type { FieldRootContextValue } from '../../internals/field-root-context/FieldRootContext'
import type {
  FormValues,
  ValidationMode,
} from '../../internals/form-context/FormContext'
import type { JSX } from 'solid-js'
/**
 * Groups all parts of the field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldRoot(componentProps: FieldRootProps): JSX.Element {
  return (
    <LabelableProvider>
      <FieldRootInner {...componentProps} />
    </LabelableProvider>
  )
}
export interface FieldValidityData {
  state: {
    badInput: boolean
    customError: boolean
    patternMismatch: boolean
    rangeOverflow: boolean
    rangeUnderflow: boolean
    stepMismatch: boolean
    tooLong: boolean
    tooShort: boolean
    typeMismatch: boolean
    valueMissing: boolean
    valid: boolean | null
  }
  error: string
  errors: Array<string>
  value: unknown
  initialValue: unknown
}
export interface FieldRootActions {
  validate: () => void
}
export interface FieldRootState extends Record<string, unknown> {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean
  /**
   * Whether the field has been touched.
   */
  touched: boolean
  /**
   * Whether the field value has changed from its initial value.
   */
  dirty: boolean
  /**
   * Whether the field is valid.
   */
  valid: boolean | null
  /**
   * Whether the field has a value.
   */
  filled: boolean
  /**
   * Whether the field is focused.
   */
  focused: boolean
}
export type FieldRootProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  children?: JSX.Element
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined
  /**
   * Custom validation. Return error message(s) or `null` when valid.
   */
  validate?:
    | ((
        value: unknown,
        formValues: FormValues
      ) =>
        string | Array<string> | null | Promise<string | Array<string> | null>)
    | undefined
  /**
   * Determines when the field should be validated.
   * @default 'onSubmit'
   */
  validationMode?: ValidationMode | undefined
  /**
   * Debounce for `validate` when `validationMode="onChange"`.
   * @default 0
   */
  validationDebounceTime?: number | undefined
  /**
   * Whether the field is invalid (external control).
   */
  invalid?: boolean | undefined
  /**
   * Controlled dirty state.
   */
  dirty?: boolean | undefined
  /**
   * Controlled touched state.
   */
  touched?: boolean | undefined
  /**
   * Imperative actions (`validate`).
   */
  actionsRef?: { current: FieldRootActions | null } | undefined
  render?: RenderProp<FieldRootState, Record<string, unknown>>
}
function FieldRootInner(componentProps: FieldRootProps): JSX.Element {
  const form = useFormContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'validate',
    'validationDebounceTime',
    'validationMode',
    'name',
    'disabled',
    'invalid',
    'dirty',
    'touched',
    'actionsRef',
    'children',
    'ref',
  ])

  const fieldset = useFieldsetRootContext(true)

  const validate = (
    value: unknown,
    formValues: FormValues
  ): string | Array<string> | null | Promise<string | Array<string> | null> => {
    const fn = local.validate
    if (!fn) return null
    return fn(value, formValues)
  }

  const disabled = () =>
    Boolean(fieldset?.disabled()) || Boolean(local.disabled)

  const [touchedState, touchedStateAssign] = createSignal(false)
  const [dirtyState, dirtyStateAssign] = createSignal(false)
  const [filled, filledAssign] = createSignal(false)
  const [focused, focusedAssign] = createSignal(false)

  const dirty = () => local.dirty ?? dirtyState()
  const touched = () => local.touched ?? touchedState()

  const markedDirtyRef = { current: dirty() }
  const registeredFieldIdRef: { current: string | undefined } = {
    current: undefined,
  }
  const [registeredFieldName, registeredFieldNameAssign] = createSignal<
    string | undefined
  >()
  const effectiveName = () => local.name ?? registeredFieldName()

  createEffect(() => {
    if (local.dirty !== undefined) {
      markedDirtyRef.current = local.dirty
    }
  })

  const dirtyAssign = (value: boolean | ((prev: boolean) => boolean)) => {
    if (local.dirty !== undefined) {
      return
    }
    const resolved = typeof value === 'function' ? value(dirtyState()) : value
    if (resolved) {
      markedDirtyRef.current = true
    }
    dirtyStateAssign(resolved)
  }

  const touchedAssign = (value: boolean | ((prev: boolean) => boolean)) => {
    if (local.touched !== undefined) {
      return
    }
    const resolved = typeof value === 'function' ? value(touchedState()) : value
    touchedStateAssign(resolved)
  }

  const validationMode = (): ValidationMode =>
    local.validationMode ?? form.validationMode

  const shouldValidateOnChange = () =>
    validationMode() === 'onChange' ||
    (validationMode() === 'onSubmit' && form.submitAttemptedRef.current)

  const formError = () => {
    const name = effectiveName()
    const errors = form.errors()
    if (name && Object.hasOwn(errors, name)) {
      return errors[name]
    }
    return null
  }
  const hasFormError = () => {
    const err = formError()
    return !!(Array.isArray(err) ? err.length : err)
  }
  const invalid = () => local.invalid === true || hasFormError()

  const [validityData, validityDataAssign] = createSignal<FieldValidityData>({
    state: { ...DEFAULT_VALIDITY_STATE },
    error: '',
    errors: [],
    value: null,
    initialValue: null,
  })

  // App-controlled invalidity keeps the field marked invalid even while disabled.
  const valid = (): boolean | null =>
    !invalid() && (disabled() ? null : validityData().state.valid)

  const state: FieldRootState = {
    get disabled() {
      return disabled()
    },
    get touched() {
      return touched()
    },
    get dirty() {
      return dirty()
    },
    get valid() {
      return valid()
    },
    get filled() {
      return filled()
    },
    get focused() {
      return focused()
    },
  }

  const validation = createFieldValidation({
    validityDataAssign,
    validate,
    validityData,
    validationDebounceTime: () => local.validationDebounceTime ?? 0,
    invalid,
    markedDirtyRef,
    state,
    shouldValidateOnChange,
    registeredFieldIdRef,
  })

  const [validateFieldControl, registerFieldControl] =
    createFieldControlRegistration({
      commit: validation.commit,
      invalid,
      markedDirtyRef,
      name: () => local.name,
      registeredFieldNameAssign,
      registeredFieldIdRef,
      validityDataAssign,
      validityData,
    })

  createEffect(() => {
    const actionsRef = local.actionsRef
    if (!actionsRef) return
    actionsRef.current = { validate: validateFieldControl }
  })

  const contextValue: FieldRootContextValue = {
    invalid,
    name: effectiveName,
    validityData,
    validityDataAssign,
    disabled,
    touchedAssign,
    dirtyAssign,
    filledAssign,
    focusedAssign,
    validationMode,
    shouldValidateOnChange,
    state,
    registerFieldControl,
    validation,
  }

  return (
    <FieldRootContext.Provider value={contextValue}>
      <FieldRootRender
        state={state}
        render={local.render}
        class={local.class}
        style={local.style}
        elementProps={elementProps}
        ref={local.ref}
      >
        {local.children}
      </FieldRootRender>
    </FieldRootContext.Provider>
  )
}
/**
 * Renders the Field root host under {@link FieldRootContext} so memoized
 * children still see the provider, while `children()` prevents `data-*`
 * attribute updates from remounting controls.
 */
function FieldRootRender(props: {
  state: FieldRootState
  render: FieldRootProps['render']
  class: FieldRootProps['class']
  style: FieldRootProps['style']
  elementProps: Record<string, unknown>
  ref: FieldRootProps['ref']
  children?: JSX.Element
}): JSX.Element {
  const resolvedChildren = children(() => props.children)

  return createRender<FieldRootState, Record<string, unknown>>({
    defaultElement: 'div',
    state: props.state,
    render: props.render,
    stateAttributesMapping: fieldValidityMapping,
    props: mergeProps(props.elementProps, {
      get class() {
        return props.class
      },
      get style() {
        return props.style
      },
      get children() {
        return resolvedChildren()
      },
      ref: props.ref,
    }),
  })
}
