import { getTarget, ownerDocument } from '@script-augur/base-ui-utils'
import { createEffect, createUniqueId, onCleanup } from 'solid-js'

import { useLabelableContext } from './LabelableContext'

import type { Accessor, JSX, Setter } from 'solid-js'
/**
 * Builds label interaction props (native `<label>` or non-native click-to-focus).
 */
export function createLabel(
  params: CreateLabelParameters = {}
): Accessor<CreateLabelReturnValue> {
  const native = () => params.native?.() ?? false
  const idProp = () => params.id?.()
  const fallbackControlId = () => params.fallbackControlId?.()
  const focusControlProp = params.focusControl

  const { controlId: contextControlId, labelIdAssign: contextLabelIdAssign } =
    useLabelableContext()

  const syncLabelId = (
    nextLabelId:
      string | undefined | ((prev: string | undefined) => string | undefined)
  ) => {
    contextLabelIdAssign(nextLabelId)
    params.labelIdAssign?.(nextLabelId)
  }

  const generatedId = createUniqueId()
  // Do not read context `labelId` here — writing it in the effect below would loop.
  const id = () => idProp() ?? generatedId

  createEffect(() => {
    const currentId = id()
    syncLabelId(currentId)
    onCleanup(() => {
      syncLabelId(previous => (previous === currentId ? undefined : previous))
    })
  })

  const resolvedControlId = () => contextControlId() ?? fallbackControlId()

  function focusControl(event: MouseEvent) {
    if (focusControlProp) {
      focusControlProp(event, resolvedControlId())
      return
    }

    const controlIdValue = resolvedControlId()
    if (!controlIdValue) {
      return
    }

    const controlElement = ownerDocument(
      event.currentTarget as Node
    ).getElementById(controlIdValue)
    if (controlElement instanceof HTMLElement) {
      focusElementWithVisible(controlElement)
    }
  }

  function handleInteraction(event: MouseEvent) {
    const target = getTarget(event) as HTMLElement | null
    if (target?.closest('button,input,select,textarea')) {
      return
    }

    // Prevent text selection when double clicking label.
    if (!event.defaultPrevented && event.detail > 1) {
      event.preventDefault()
    }

    if (native()) {
      return
    }

    focusControl(event)
  }

  return () =>
    native()
      ? {
          id: id(),
          htmlFor: resolvedControlId() ?? undefined,
          onMouseDown: handleInteraction,
        }
      : {
          id: id(),
          onClick: handleInteraction,
          onPointerDown(event: PointerEvent) {
            event.preventDefault()
          },
        }
}
/**
 * Focuses an element requesting visible focus indicators when supported.
 */
export function focusElementWithVisible(element: HTMLElement): void {
  element.focus({
    // Available from Chrome 144+ (January 2026).
    // Safari and Firefox already support it.
    focusVisible: true,
  } as FocusOptions)
}
export interface CreateLabelParameters {
  id?: Accessor<string | undefined>
  /**
   * Control id used when no labelable context control id exists.
   */
  fallbackControlId?: Accessor<string | null | undefined>
  /**
   * Whether the rendered element is a native `<label>`.
   * @default false
   */
  native?: Accessor<boolean | undefined>
  /**
   * Additional callback to sync the current label id with local component state.
   */
  labelIdAssign?: Setter<string | undefined>
  /**
   * Custom focus handler for non-native labels.
   */
  focusControl?:
    | ((event: MouseEvent, controlId: string | null | undefined) => void)
    | undefined
}
export type CreateLabelReturnValue = JSX.HTMLAttributes<HTMLElement> &
  JSX.LabelHTMLAttributes<HTMLLabelElement>
