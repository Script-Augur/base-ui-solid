import {
  clamp,
  formatNumber,
  valueToPercent,
} from '@script-augur/base-ui-utils'
import { createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'

import { ProgressRootContext } from './ProgressRootContext'
import { ProgressRootDataAttributes } from './ProgressRootDataAttributes'

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
 * Groups all parts of the progress bar and provides the task completion status to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 *
 * @param componentProps - Root props (`value`, `min`, `max`, `format`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Progress } from "@script-augur/base-ui-solid/progress"
 *
 * <Progress.Root value={50}>
 *   <Progress.Label>Upload</Progress.Label>
 *   <Progress.Value />
 *   <Progress.Track>
 *     <Progress.Indicator />
 *   </Progress.Track>
 * </Progress.Root>
 * ```
 */
export function ProgressRoot(componentProps: ProgressRootProps): JSX.Element {
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
    const currentValue = value()
    const minValue = min()
    const maxValue = max()

    let status: ProgressStatus = 'indeterminate'
    let percentageValue: number | null = null
    let clampedValue: number | null = null
    let formattedValue = ''
    let defaultAriaValueText = 'indeterminate progress'

    if (currentValue != null && Number.isFinite(currentValue)) {
      const rawPercentage = valueToPercent(currentValue, minValue, maxValue)
      percentageValue = clamp(
        Number.isNaN(rawPercentage) ? 0 : rawPercentage,
        0,
        100
      )
      clampedValue = clamp(currentValue, minValue, maxValue)
      status = clampedValue === maxValue ? 'complete' : 'progressing'
      formattedValue = format()
        ? formatNumber(clampedValue, locale(), format())
        : formatNumber(percentageValue / 100, locale(), {
            style: 'percent',
          })
      defaultAriaValueText = formattedValue
    }

    return {
      status,
      percentageValue,
      clampedValue,
      formattedValue,
      defaultAriaValueText,
    }
  })

  const status = () => derived().status

  const ariaValueText = () => {
    const ariaValueTextFn = getAriaValueText()
    if (ariaValueTextFn) {
      return ariaValueTextFn(derived().formattedValue, value())
    }
    return derived().defaultAriaValueText
  }

  const state: ProgressRootState = {
    get status() {
      return status()
    },
  }

  const contextValue = {
    formattedValue: () => derived().formattedValue,
    percentageValue: () => derived().percentageValue,
    value,
    labelIdAssign,
    status,
  }

  return (
    <ProgressRootContext.Provider value={contextValue}>
      {createRender<ProgressRootState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get role() {
            return 'progressbar' as const
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
            return derived().clampedValue ?? undefined
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
          get [ProgressRootDataAttributes.indeterminate]() {
            return dataAttr(status() === 'indeterminate')
          },
          get [ProgressRootDataAttributes.progressing]() {
            return dataAttr(status() === 'progressing')
          },
          get [ProgressRootDataAttributes.complete]() {
            return dataAttr(status() === 'complete')
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
    </ProgressRootContext.Provider>
  )
}

/** Progress completion status shared by all parts. */
export type ProgressStatus = 'indeterminate' | 'progressing' | 'complete'

/**
 * Public state exposed to `render` functions.
 */
export interface ProgressRootState extends Record<string, unknown> {
  /** The current status. */
  status: ProgressStatus
}

/**
 * Props for {@link ProgressRoot}.
 */
export type ProgressRootProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'role'
> & {
  /**
   * A string value that provides a user-friendly name for `aria-valuenow`.
   */
  'aria-valuetext'?: JSX.AriaAttributes['aria-valuetext']
  /**
   * Options to format the value.
   */
  format?: Intl.NumberFormatOptions
  /**
   * Returns human-readable text for the current value of the progress bar.
   */
  getAriaValueText?: (formattedValue: string, value: number | null) => string
  /**
   * Locale used by `Intl.NumberFormat` when formatting the value.
   */
  locale?: Intl.LocalesArgument
  /**
   * The maximum value.
   * @default 100
   */
  max?: number
  /**
   * The minimum value.
   * @default 0
   */
  min?: number
  /**
   * The current value. The component is indeterminate when value is `null`.
   */
  value: number | null
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ProgressRootState, Record<string, unknown>>
}
