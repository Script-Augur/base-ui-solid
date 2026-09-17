import {
  For,
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createRender } from '../../internals/createRender'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { fieldValidityMapping } from '../../internals/field-constants/constants'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../../internals/form-context/FormContext'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { transitionStatusMapping } from '../../internals/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { FieldRootState } from '../root/FieldRoot'
import type { JSX, JSXElement } from 'solid-js'

const stateAttributesMapping = {
  ...fieldValidityMapping,
  ...transitionStatusMapping,
} as StateAttributesMapping<FieldErrorState & Record<string, unknown>>

/**
 * An error message displayed if the field control fails validation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldError(componentProps: FieldErrorProps): JSX.Element {
  const field = useFieldRootContext(false)
  const { messageIdsAssign } = useLabelableContext()
  const { errors } = useFormContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'match',
    'children',
    'ref',
  ])

  const generatedId = createUniqueId()
  const id = () => (local.id !== undefined ? local.id : generatedId)

  const formError = () => {
    const name = field.name()
    const allErrors = errors()
    if (name && Object.hasOwn(allErrors, name)) {
      return allErrors[name]
    }
    return null
  }
  const hasFormError = () => {
    const err = formError()
    return !!(Array.isArray(err) ? err.length : err)
  }
  const hasSpecificMatch = () => typeof local.match === 'string'

  function rendered() {
    if (local.match === true) return true
    if (field.state.disabled) return false
    if (hasSpecificMatch()) {
      const validityState = field.validityData().state as Record<
        string,
        boolean | null
      >
      return Boolean(validityState[String(local.match)])
    }
    return hasFormError() || field.validityData().state.valid === false
  }

  const { mounted, transitionStatus, mountedAssign } =
    createTransitionStatus(rendered)

  createEffect(() => {
    const currentId = id()
    if (!rendered() || !currentId) return

    messageIdsAssign(v => v.concat(currentId))
    onCleanup(() => {
      messageIdsAssign(v => v.filter(item => item !== currentId))
    })
  })

  const errorRef: { current: HTMLDivElement | null } = { current: null }
  const [lastRenderedMessage, lastRenderedMessageAssign] =
    createSignal<JSXElement>(null)
  const [lastRenderedMessageKey, lastRenderedMessageKeyAssign] = createSignal<
    string | null
  >(null)

  function error(): string | Array<string> | null | undefined {
    if (!hasSpecificMatch() && hasFormError()) {
      return formError()
    }
    const data = field.validityData()
    return data.errors.length > 1 ? data.errors : data.error
  }

  function errorMessage(): JSXElement {
    const err = error()
    if (!Array.isArray(err)) return err
    // Keep single-message path as text; list only when multiple.
    if (err.length <= 1) return err[0]

    return (
      <ul>
        <For each={err}>{message => <li>{message}</li>}</For>
      </ul>
    )
  }

  function errorKey() {
    const err = error()
    return Array.isArray(err) ? JSON.stringify(err) : (err ?? null)
  }

  createEffect(() => {
    if (rendered() && errorKey() !== lastRenderedMessageKey()) {
      lastRenderedMessageKeyAssign(errorKey())
      lastRenderedMessageAssign(errorMessage())
    }
  })

  createOpenChangeComplete({
    open: rendered,
    element: () => errorRef.current,
    onComplete() {
      if (!rendered()) {
        mountedAssign(false)
      }
    },
  })

  const state: FieldErrorState = {
    get disabled() {
      return field.state.disabled
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
    get transitionStatus() {
      return transitionStatus()
    },
  }

  return (
    <Show when={mounted()}>
      {createRender<FieldErrorState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        ref: [local.ref as ((el: Element) => void) | undefined, errorRef],
        stateAttributesMapping,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get id() {
            return id() || undefined
          },
          get children() {
            return rendered()
              ? (local.children ?? errorMessage())
              : lastRenderedMessage()
          },
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
        }),
      })}
    </Show>
  )
}

export interface FieldErrorState extends FieldRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus
}

export type FieldErrorProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  /**
   * Determines whether to show the error message according to ValidityState.
   * `true` always shows the message.
   */
  match?: boolean | keyof ValidityState | undefined
  children?: JSX.Element
  render?: RenderProp<FieldErrorState, Record<string, unknown>>
}
