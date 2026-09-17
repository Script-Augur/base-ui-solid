import { createContext, useContext } from 'solid-js'

import { NOOP } from '../noop'

import type { Accessor, Setter } from 'solid-js'

/** Default labelable context when no Provider is present. */
export const DEFAULT_LABELABLE_CONTEXT: LabelableContextValue = {
  controlId: () => undefined,
  registerControlId: NOOP,
  labelId: () => undefined,
  labelIdAssign: NOOP as Setter<string | undefined>,
  messageIds: () => [],
  messageIdsAssign: NOOP,
  getDescriptionProps: (externalProps: HTMLProps) => externalProps,
}

export const LabelableContext = createContext<LabelableContextValue>(
  DEFAULT_LABELABLE_CONTEXT
)
/**
 * Reads the nearest labelable context (defaults when no Provider).
 */
export function useLabelableContext(): LabelableContextValue {
  return useContext(LabelableContext)
}
/** Props bag for description / aria merging. */
export type HTMLProps = Record<string, unknown>
/**
 * Context for labelable controls (label + description association).
 */
export interface LabelableContextValue {
  /**
   * The `id` of the labelable element.
   * When `null` the association is implicit.
   */
  controlId: Accessor<string | null | undefined>
  registerControlId: (source: symbol, id: string | null | undefined) => void
  /**
   * The `id` of the label.
   */
  labelId: Accessor<string | undefined>
  labelIdAssign: Setter<string | undefined>
  /**
   * An array of `id`s of elements that provide an accessible description.
   */
  messageIds: Accessor<Array<string>>
  messageIdsAssign: Setter<Array<string>>
  getDescriptionProps: (externalProps: HTMLProps) => HTMLProps
}
