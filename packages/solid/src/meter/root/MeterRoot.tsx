import {
  clamp,
  formatNumber,
  valueToPercent,
} from '@script-augur/base-ui-utils'
import { createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import { MeterRootContext } from './MeterRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

const visuallyHiddenStyle = {
  'clip-path': 'inset(50%)',
  overflow: 'hidden',
  'white-space': 'nowrap',
  border: 0,
  padding: 0,
  width: '1px',
  height: '1px',
  margin: '-1px',
  position: 'fixed',
  top: 0,
  left: 0,
} as JSX.CSSProperties

/**
 * Groups all parts of the meter and provides the value for screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 *
 * @param componentProps - Root props (`value`, `min`, `max`, `format`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Meter } from "@script-augur/base-ui-solid/meter"
 *
 * <Meter.Root value={50}>
 *   <Meter.Label>Battery</Meter.Label>
 *   <Meter.Value />
 *   <Meter.Track>
 *     <Meter.Indicator />
 *   </Meter.Track>
 * </Meter.Root>
 * ```
 */
export function MeterRoot(componentProps: MeterRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'format',
    'getAriaValueText',
    'locale',
    'max',
    'min',
    'value',
    'children',
    'ref',
  ])

  const [labelId, labelIdAssign] = createSignal<string | undefined>()

  const min = () => local.min ?? 0
  const max = () => local.max ?? 100
  const value = () => local.value
  const format = () => local.format
  const locale = () => local.locale
  const getAriaValueText = () => local.getAriaValueText

  const derived = createMemo(() => {
    const valueProp = value()
    const minValue = min()
    const maxValue = max()

    // `clamp` handles infinity, but NaN needs an explicit fallback before normalizing range outputs.
    const rawPercentage = valueToPercent(valueProp, minValue, maxValue)
    const percentageValue = clamp(
      Number.isNaN(rawPercentage) ? 0 : rawPercentage,
      0,
      100
    )
    const clampedValue = clamp(
      Number.isNaN(valueProp) ? minValue : valueProp,
      minValue,
      maxValue
    )

    // Format the clamped value so visible and accessible text stay in sync with `aria-valuenow` and
    // the indicator fill. The raw value remains available as the second `getAriaValueText` argument.
    const formattedValue = format()
      ? formatNumber(clampedValue, locale(), format())
      : formatNumber(percentageValue / 100, locale(), { style: 'percent' })

    return {
      percentageValue,
      clampedValue,
      formattedValue,
    }
  })

  const ariaValueText = () => {
    const ariaValueTextFn = getAriaValueText()
    if (ariaValueTextFn) {
      return ariaValueTextFn(derived().formattedValue, value())
    }
    return derived().formattedValue
  }

  const state: MeterRootState = {}

  const contextValue = {
    formattedValue: () => derived().formattedValue,
    percentageValue: () => derived().percentageValue,
    labelIdAssign,
    value,
  }

  return (
    <MeterRootContext.Provider value={contextValue}>
      {createRender<MeterRootState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get role() {
            return 'meter' as const
          },
          get 'aria-labelledby'() {
            return labelId()
          },
          get 'aria-valuemax'() {
            return max()
          },
          get 'aria-valuemin'() {
            return min()
          },
          get 'aria-valuenow'() {
            return derived().clampedValue
          },
          get 'aria-valuetext'() {
            return ariaValueText()
          },
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get children() {
            return (
              <>
                {local.children}
                <span role="presentation" style={visuallyHiddenStyle}>
                  x
                </span>
              </>
            )
          },
          ref: local.ref,
        }),
      })}
    </MeterRootContext.Provider>
  )
}

/**
 * Public state exposed to `render` functions.
 */
export interface MeterRootState extends Record<string, unknown> {}

/**
 * Props for {@link MeterRoot}.
 */
export type MeterRootProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'role'
> & {
  /**
   * A string value that provides a user-friendly name for `aria-valuenow`, the current value of the meter.
   */
  'aria-valuetext'?: JSX.AriaAttributes['aria-valuetext']
  /**
   * Options to format the value.
   */
  format?: Intl.NumberFormatOptions
  /**
   * A function that returns a string value that provides a human-readable text alternative for `aria-valuenow`, the current value of the meter.
   */
  getAriaValueText?: (formattedValue: string, value: number) => string
  /**
   * The locale used by `Intl.NumberFormat` when formatting the value.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument
  /**
   * The maximum value
   * @default 100
   */
  max?: number
  /**
   * The minimum value
   * @default 0
   */
  min?: number
  /**
   * The current value.
   */
  value: number
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<MeterRootState, Record<string, unknown>>
}
