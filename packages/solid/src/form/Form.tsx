import {
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createGenericEventDetails,
} from '../internals/createChangeEventDetails'
import { createRender } from '../internals/createRender'
import { FormContext } from '../internals/form-context/FormContext'

import type { BaseUIGenericEventDetails } from '../internals/createChangeEventDetails'
import type { RenderProp } from '../internals/createRender'
import type {
  Errors,
  FormContextValue,
  FormValues,
  ValidationMode,
} from '../internals/form-context/FormContext'
import type { JSX } from 'solid-js'

const EMPTY_ERRORS: Errors = {}

/**
 * A native form element with consolidated error handling.
 * Renders a `<form>` element.
 *
 * Documentation: [Base UI Form](https://base-ui.com/react/components/form)
 *
 * @param componentProps - Form props (`errors`, `onFormSubmit`, `validationMode`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Form } from "@script-augur/base-ui-solid/form"
 * import { Field } from "@script-augur/base-ui-solid/field"
 *
 * <Form
 *   onFormSubmit={(values) => {
 *     console.log(values)
 *   }}
 * >
 *   <Field.Root name="email">
 *     <Field.Control required />
 *     <Field.Error />
 *   </Field.Root>
 *   <button type="submit">Submit</button>
 * </Form>
 * ```
 */
export function Form<TValues extends FormValues = FormValues>(
  componentProps: FormProps<TValues>
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'validationMode',
    'errors',
    'onSubmit',
    'onFormSubmit',
    'actionsRef',
    'noValidate',
  ])

  const formRef: FormContextValue['formRef'] = {
    current: {
      fields: new Map(),
    },
  }
  const elementRef: FormContextValue['elementRef'] = { current: null }
  const submittedRef = { current: false }
  const submitAttemptedRef = { current: false }

  const [errors, errorsAssign] = createSignal<Errors>(
    local.errors ?? EMPTY_ERRORS
  )

  createEffect(() => {
    errorsAssign(local.errors ?? EMPTY_ERRORS)
  })

  /**
   * Focus the first invalid field control in document order.
   *
   * A field can be invalid without a focusable control (for example a checkbox
   * group whose custom validation failed while every checkbox is unmounted,
   * disabled, or reassociated). Keep submission blocked, but move focus to
   * the first invalid field that has a usable control.
   *
   * Registration order can diverge from DOM order (keyed fields reordered
   * without remounting, portals), so pick the first control by document
   * position. For controls in disconnected trees (e.g. separate shadow roots),
   * where document position is implementation-specific, keep registration order.
   *
   * @returns `true` when submission should stay blocked (invalid fields exist).
   */
  function focusFirstInvalid(): boolean {
    let hasInvalid = false
    let firstControl: HTMLElement | null = null

    for (const field of formRef.current.fields.values()) {
      if (field.validityData.state.valid !== false) continue

      hasInvalid = true
      const control = field.controlRef.current
      if (
        control &&
        (!firstControl || comesBeforeInSameTree(control, firstControl))
      ) {
        firstControl = control
      }
    }

    if (firstControl) {
      firstControl.focus()
      if (firstControl.tagName === 'INPUT') {
        ;(firstControl as HTMLInputElement).select()
      }
      return true
    }

    return hasInvalid
  }

  createEffect(() => {
    errors()
    if (!submittedRef.current) {
      return
    }
    submittedRef.current = false
    focusFirstInvalid()
  })

  createEffect(() => {
    const actionsRef = local.actionsRef
    if (!actionsRef) return

    actionsRef.current = {
      validate(fieldName) {
        if (fieldName) {
          Array.from(formRef.current.fields.values())
            .find(field => field.name === fieldName)
            ?.validate()
        } else {
          formRef.current.fields.forEach(field => {
            field.validate()
          })
        }
      },
    }

    onCleanup(() => {
      actionsRef.current = null
    })
  })

  function clearErrors(name: string | undefined) {
    if (name && Object.hasOwn(errors(), name)) {
      errorsAssign(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const contextValue: FormContextValue = {
    elementRef,
    formRef,
    get validationMode() {
      return local.validationMode ?? 'onSubmit'
    },
    errors,
    clearErrors,
    submitAttemptedRef,
  }

  const state: FormState = {}

  return (
    <FormContext.Provider value={contextValue}>
      {createRender<FormState, Record<string, unknown>>({
        defaultElement: 'form',
        state,
        render: local.render,
        ref: [
          local.ref as ((el: Element) => void) | undefined,
          el => {
            elementRef.current = (el as HTMLFormElement | null) ?? null
          },
        ],
        props: mergeProps(elementProps as Record<string, unknown>, {
          get noValidate() {
            return local.noValidate !== false
          },
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get children() {
            return local.children
          },
          onSubmit(
            event: Event & {
              currentTarget: HTMLFormElement
              target: Element
            }
          ) {
            submitAttemptedRef.current = true

            // Async validation isn't supported to stop the submit event.
            formRef.current.fields.forEach(field => {
              field.validate()
            })

            if (focusFirstInvalid()) {
              event.preventDefault()
              return
            }

            submittedRef.current = true
            local.onSubmit?.(event)

            if (local.onFormSubmit) {
              event.preventDefault()
              const formValues = {} as TValues
              formRef.current.fields.forEach(field => {
                if (field.name) {
                  ;(formValues as FormValues)[field.name] = field.getValue()
                }
              })
              local.onFormSubmit(
                formValues,
                createGenericEventDetails(REASONS.none, event)
              )
            }
          },
        }),
      })}
    </FormContext.Provider>
  )
}

/** Reason string for Form submit callbacks. */
export type FormSubmitEventReason = typeof REASONS.none

/** Event details passed to {@link FormProps.onFormSubmit}. */
export type FormSubmitEventDetails =
  BaseUIGenericEventDetails<FormSubmitEventReason>

/** Imperative Form actions exposed via {@link FormProps.actionsRef}. */
export interface FormActions {
  /**
   * Validates all fields when called.
   * Optionally pass a field name to validate a single field.
   */
  validate: (fieldName?: string | undefined) => void
}

/** Public state exposed to `render` functions. */
export interface FormState extends Record<string, unknown> {}

/**
 * Props for {@link Form}.
 *
 * @typeParam TValues - Shape of values collected for {@link onFormSubmit}.
 */
export type FormProps<TValues extends FormValues = FormValues> = Omit<
  JSX.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit'
> & {
  /**
   * Determines when the form should be validated.
   * The `validationMode` prop on `<Field.Root>` takes precedence over this.
   *
   * - `onSubmit` (default): validates the field when the form is submitted, afterwards fields will re-validate on change.
   * - `onBlur`: validates a field when it loses focus.
   * - `onChange`: validates the field on every change to its value.
   *
   * @default 'onSubmit'
   */
  validationMode?: ValidationMode | undefined
  /**
   * Validation errors returned externally, typically after submission by a server or a form action.
   * Keys correspond to the `name` attribute on `<Field.Root>`.
   */
  errors?: Errors | undefined
  /**
   * Native submit handler. Called after client validation succeeds.
   */
  onSubmit?:
    | ((
        event: Event & {
          currentTarget: HTMLFormElement
          target: Element
        }
      ) => void)
    | undefined
  /**
   * Event handler called when the form is submitted.
   * `preventDefault()` is called on the native submit event when used.
   */
  onFormSubmit?:
    | ((formValues: TValues, eventDetails: FormSubmitEventDetails) => void)
    | undefined
  /**
   * A ref to imperative actions.
   * - `validate`: Validates all fields when called. Optionally pass a field name to validate a single field.
   */
  actionsRef?: { current: FormActions | null } | undefined
  /**
   * Whether to disable native HTML validation.
   * @default true
   */
  noValidate?: boolean | undefined
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<FormState, Record<string, unknown>>
}

function comesBeforeInSameTree(
  element: HTMLElement,
  reference: HTMLElement
): boolean {
  const position = element.compareDocumentPosition(reference)
  return (
    (position & Node.DOCUMENT_POSITION_DISCONNECTED) === 0 &&
    (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
  )
}
