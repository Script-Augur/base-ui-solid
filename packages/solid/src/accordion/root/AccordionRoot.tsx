import { createEffect, createSignal, mergeProps, splitProps } from 'solid-js'

import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'

import { AccordionRootContext } from './AccordionRootContext'
import { AccordionRootDataAttributes } from './AccordionRootDataAttributes'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { Orientation } from '../../separator/Separator'
import type { JSX } from 'solid-js'

const EMPTY_ARRAY: AccordionValue = []

/**
 * Groups all parts of the accordion.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 *
 * @param componentProps - Root props (`value`, `multiple`, `onValueChange`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Accordion } from "@script-augur/base-ui-solid/accordion"
 *
 * <Accordion.Root defaultValue={["a"]}>
 *   <Accordion.Item value="a">…</Accordion.Item>
 *   <Accordion.Item value="b">…</Accordion.Item>
 * </Accordion.Root>
 * ```
 */
export function AccordionRoot(componentProps: AccordionRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'hiddenUntilFound',
    'keepMounted',
    'loopFocus',
    'onValueChange',
    'multiple',
    'orientation',
    'value',
    'defaultValue',
    'ref',
  ])

  createEffect(() => {
    if (local.hiddenUntilFound && local.keepMounted === false) {
      console.warn(
        'Base UI: The `keepMounted={false}` prop on `Accordion.Root` is ignored when `hiddenUntilFound` is enabled, since panels must remain mounted while closed.'
      )
    }
  })

  const disabled = () => local.disabled ?? false
  const multiple = () => local.multiple ?? false
  const orientation = () => local.orientation ?? 'vertical'
  const hiddenUntilFound = () => local.hiddenUntilFound ?? false
  const keepMounted = () => local.keepMounted ?? false

  const [value, valueAssign] = createControlled({
    value: () => local.value,
    defaultValue: local.defaultValue ?? EMPTY_ARRAY,
  })

  const [itemKeys, itemKeysAssign] = createSignal<Array<string>>([])

  const registerItem = (key: string) => {
    itemKeysAssign(prev => (prev.includes(key) ? prev : [...prev, key]))
    return () => {
      itemKeysAssign(prev => prev.filter(k => k !== key))
    }
  }

  const handleValueChange = (
    itemValue: AccordionValue[number],
    nextOpen: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => {
    const current = value()
    let nextValue: AccordionValue

    if (!multiple()) {
      nextValue = current[0] === itemValue ? [] : [itemValue]
    } else if (nextOpen) {
      nextValue = current.includes(itemValue)
        ? current.slice()
        : [...current, itemValue]
    } else {
      nextValue = current.filter(v => v !== itemValue)
    }

    local.onValueChange?.(nextValue, eventDetails)
    if (eventDetails.isCanceled) return

    valueAssign(nextValue)
  }

  const state: AccordionRootState = {
    get value() {
      return value()
    },
    get disabled() {
      return disabled()
    },
    get orientation() {
      return orientation()
    },
  }

  // `loopFocus` is accepted for API parity with Base UI; roving tabindex was
  // removed upstream following APG guidance.
  void local.loopFocus

  const contextValue = {
    disabled,
    handleValueChange,
    hiddenUntilFound,
    keepMounted,
    state,
    value,
    registerItem,
    itemKeys,
  }

  return (
    <AccordionRootContext.Provider value={contextValue}>
      {createRender<AccordionRootState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get [AccordionRootDataAttributes.disabled]() {
            return dataAttr(disabled())
          },
          get [AccordionRootDataAttributes.orientation]() {
            return orientation()
          },
          ref: local.ref,
        }),
      })}
    </AccordionRootContext.Provider>
  )
}

/** Open item values for an accordion. */
export type AccordionValue = Array<string | number>

/**
 * Public state exposed to `render` functions.
 */
export interface AccordionRootState extends Record<string, unknown> {
  /** The current open item values. */
  value: AccordionValue
  /** Whether the component should ignore user interaction. */
  disabled: boolean
  /**
   * The component orientation.
   *
   * @deprecated No longer affects keyboard focus behavior (APG update).
   */
  orientation: Orientation
}

/**
 * Props for {@link AccordionRoot}.
 */
export type AccordionRootProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'defaultValue'
> & {
  /**
   * The controlled value of the item(s) that should be expanded.
   * Controlled counterpart of `defaultValue`.
   */
  value?: AccordionValue
  /**
   * The uncontrolled value of the item(s) that should be initially expanded.
   * Uncontrolled counterpart of `value`.
   */
  defaultValue?: AccordionValue
  /** Whether the component should ignore user interaction. @default false */
  disabled?: boolean
  /**
   * Allows the browser's built-in page search to find and expand panel
   * contents. Overrides `keepMounted` and uses `hidden="until-found"`.
   * @default false
   */
  hiddenUntilFound?: boolean
  /**
   * Whether to keep panels in the DOM while closed.
   * Ignored when `hiddenUntilFound` is used.
   * @default false
   */
  keepMounted?: boolean
  /**
   * Accepted for API parity; no longer affects keyboard focus.
   * @deprecated
   */
  loopFocus?: boolean
  /**
   * Called when an accordion item is expanded or collapsed.
   * Call `eventDetails.cancel()` to prevent the update.
   */
  onValueChange?: (
    value: AccordionValue,
    eventDetails: AccordionRootChangeEventDetails
  ) => void
  /** Whether multiple items can be open at the same time. @default false */
  multiple?: boolean
  /**
   * Accepted for API parity; no longer affects keyboard focus.
   * @default 'vertical'
   * @deprecated
   */
  orientation?: Orientation
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<AccordionRootState, Record<string, unknown>>
}

/** Change-event reason for {@link AccordionRoot}. */
export type AccordionRootChangeEventReason = ChangeEventReason

/** Change-event details for {@link AccordionRoot}. */
export type AccordionRootChangeEventDetails =
  BaseUIChangeEventDetails<AccordionRootChangeEventReason>
