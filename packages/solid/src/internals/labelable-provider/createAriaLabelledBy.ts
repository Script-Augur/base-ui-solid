import { createEffect, createSignal, createUniqueId } from 'solid-js'

import type { Accessor } from 'solid-js'
/**
 * Resolves `aria-labelledby` from an explicit prop, context label id, or a
 * fallback native label association discovered in the DOM.
 */
export function createAriaLabelledBy(params: {
  explicitAriaLabelledBy: Accessor<string | undefined>
  labelId: Accessor<string | undefined>
  labelSourceRef: { current: LabelSource | null }
  enableFallback?: boolean
  labelSourceId?: Accessor<string | undefined>
}): Accessor<string | undefined> {
  const enableFallback = () => params.enableFallback ?? true
  const generatedLabelId = createUniqueId()
  const generatedFallbackId = () => {
    const sourceId = params.labelSourceId?.()
    return sourceId ? `${sourceId}-label` : generatedLabelId
  }

  const [fallbackAriaLabelledBy, fallbackAriaLabelledByAssign] = createSignal<
    string | undefined
  >()

  createEffect(() => {
    const explicit = params.explicitAriaLabelledBy()
    const labelId = params.labelId()
    const nextAriaLabelledBy =
      explicit || labelId || !enableFallback()
        ? undefined
        : getAriaLabelledBy(
            params.labelSourceRef.current,
            generatedFallbackId()
          )

    if (fallbackAriaLabelledBy() !== nextAriaLabelledBy) {
      fallbackAriaLabelledByAssign(nextAriaLabelledBy)
    }
  })

  return () =>
    params.explicitAriaLabelledBy() ??
    params.labelId() ??
    fallbackAriaLabelledBy()
}
function getAriaLabelledBy(
  labelSource?: LabelSource | null,
  generatedLabelId?: string
) {
  const label = findAssociatedLabel(labelSource)
  if (!label) {
    return undefined
  }

  if (!label.id && generatedLabelId) {
    label.id = generatedLabelId
  }

  return label.id || undefined
}
function findAssociatedLabel(labelSource?: LabelSource | null) {
  if (!labelSource) {
    return undefined
  }

  const parent = labelSource.parentElement
  if (parent && parent.tagName === 'LABEL') {
    return parent as HTMLLabelElement
  }

  const controlId = labelSource.id
  if (controlId) {
    const nextSibling =
      labelSource.nextElementSibling as HTMLLabelElement | null
    if (nextSibling && nextSibling.htmlFor === controlId) {
      return nextSibling
    }
  }

  const labels = labelSource.labels
  return labels && labels[0]
}
type LabelSource = HTMLElement & {
  labels?: NodeListOf<HTMLLabelElement> | null | undefined
}
