import { createEffect, createUniqueId, onCleanup } from 'solid-js'

import { NOOP } from '../noop'

import { useLabelableContext } from './LabelableContext'

import type { Accessor } from 'solid-js'

/**
 * Registers a control id with the nearest LabelableProvider and returns the
 * resolved control id (context id falling back to a generated id).
 */
export function createLabelableId(
  params: CreateLabelableIdParameters = {}
): Accessor<string | undefined> {
  const id = () => params.id?.()
  const implicit = () => params.implicit?.() ?? false
  const controlRef = params.controlRef

  const { controlId, registerControlId } = useLabelableContext()

  const defaultId = createUniqueId()
  const resolvedDefaultId = () => id() ?? defaultId

  const controlSource = Symbol()
  let hasRegistered = false
  let hadExplicitId = id() != null

  const unregisterControlId = () => {
    if (!hasRegistered || registerControlId === NOOP) {
      return
    }

    hasRegistered = false
    registerControlId(controlSource, undefined)
  }

  createEffect(() => {
    if (registerControlId === NOOP) {
      return
    }

    let nextId: string | null | undefined
    const explicitId = id()
    const isImplicit = implicit()

    if (isImplicit) {
      const elem = controlRef?.current

      if (elem instanceof Element && elem.closest('label') != null) {
        nextId = explicitId ?? null
      } else {
        // When implicit, prefer the already-registered context id if present.
        nextId = controlId() ?? resolvedDefaultId()
      }
    } else if (explicitId != null) {
      hadExplicitId = true
      nextId = explicitId
    } else if (hadExplicitId) {
      nextId = resolvedDefaultId()
    } else {
      unregisterControlId()
      return
    }

    hasRegistered = true
    registerControlId(controlSource, nextId)
  })

  createEffect(() => {
    onCleanup(unregisterControlId)
  })

  return () => controlId() ?? resolvedDefaultId()
}

export interface CreateLabelableIdParameters {
  id?: Accessor<string | undefined>
  /**
   * Whether implicit labelling is supported.
   * @default false
   */
  implicit?: Accessor<boolean | undefined>
  /**
   * A ref to an element that can be implicitly labelled.
   */
  controlRef?: { current: HTMLElement | null } | undefined
}
