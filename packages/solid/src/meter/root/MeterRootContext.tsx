import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'

const MeterRootContext = createContext<MeterRootContextValue | undefined>(
  undefined
)

export { MeterRootContext }

/**
 * Reads the nearest {@link MeterRoot} context.
 *
 * @returns Context value.
 * @throws If used outside a Meter root.
 */
export function useMeterRootContext(): MeterRootContextValue {
  const context = useContext(MeterRootContext)
  if (context) return context

  throw new Error(
    'Base UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.'
  )
}

/**
 * Shared state for meter parts nested under {@link MeterRoot}.
 */
export interface MeterRootContextValue {
  /** Formatted value of the component. */
  formattedValue: Accessor<string>
  /**
   * The value normalized to a `0`–`100` percentage of the range, clamped to those bounds.
   */
  percentageValue: Accessor<number>
  /** Registers the label element id on the root. */
  labelIdAssign: (
    value:
      | string
      | undefined
      | ((previous: string | undefined) => string | undefined)
  ) => void
  /** Raw value passed to the root. */
  value: Accessor<number>
}
