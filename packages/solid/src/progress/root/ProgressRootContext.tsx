import { createContext, useContext } from 'solid-js'

import type { ProgressStatus } from './ProgressRoot'
import type { Accessor } from 'solid-js'

const ProgressRootContext = createContext<ProgressRootContextValue | undefined>(
  undefined
)

export { ProgressRootContext }

/**
 * Reads the nearest {@link ProgressRoot} context.
 *
 * @returns Context value.
 * @throws If used outside a Progress root.
 */
export function useProgressRootContext(): ProgressRootContextValue {
  const context = useContext(ProgressRootContext)
  if (context) return context

  throw new Error(
    'Base UI: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.'
  )
}

/**
 * Shared state for progress parts nested under {@link ProgressRoot}.
 */
export interface ProgressRootContextValue {
  /** Formatted value of the component. */
  formattedValue: Accessor<string>
  /** Normalized 0–100 percentage, or `null` when indeterminate. */
  percentageValue: Accessor<number | null>
  /** Raw value passed to the root. */
  value: Accessor<number | null>
  /** Registers the label element id on the root. */
  labelIdAssign: (
    value:
      | string
      | undefined
      | ((previous: string | undefined) => string | undefined)
  ) => void
  /** Current progress status. */
  status: Accessor<ProgressStatus>
}
