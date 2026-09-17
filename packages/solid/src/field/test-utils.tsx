import { createEffect, createSignal } from 'solid-js'

import {
  DEFAULT_FORM_CONTEXT,
  FormContext,
} from '../internals/form-context/FormContext'

import type {
  Errors,
  FormContextValue,
} from '../internals/form-context/FormContext'
import type { JSX, ParentProps } from 'solid-js'

/**
 * Thin FormContext provider for Field unit tests that need external `errors`
 * without mounting the full `<Form>` element (no native submit / focus-first).
 */
export function FormErrorsProvider(
  props: ParentProps<{
    errors?: Errors
    validationMode?: FormContextValue['validationMode']
    submitAttempted?: boolean
  }>
): JSX.Element {
  const [errors, errorsAssign] = createSignal<Errors>(props.errors ?? {})
  const submitAttemptedRef = { current: props.submitAttempted ?? false }
  const formRef = {
    current: {
      fields: new Map(),
    },
  }
  const elementRef: { current: HTMLFormElement | null } = { current: null }

  createEffect(() => {
    errorsAssign(props.errors ?? {})
  })

  createEffect(() => {
    submitAttemptedRef.current = props.submitAttempted ?? false
  })

  const value: FormContextValue = {
    ...DEFAULT_FORM_CONTEXT,
    formRef,
    elementRef,
    submitAttemptedRef,
    errors,
    validationMode: props.validationMode ?? 'onSubmit',
    clearErrors(name: string | undefined) {
      if (!name) {
        errorsAssign({})
        return
      }
      errorsAssign(prev => {
        if (!Object.hasOwn(prev, name)) return prev
        const next = { ...prev }
        delete next[name]
        return next
      })
    },
  }

  return (
    <FormContext.Provider value={value}>{props.children}</FormContext.Provider>
  )
}

export async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

export async function waitFor(
  assertion: () => void | Promise<void>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const timeout = options.timeout ?? 1000
  const interval = options.interval ?? 10
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      await assertion()
      return
    } catch {
      await new Promise(resolve => setTimeout(resolve, interval))
    }
  }

  await assertion()
}
