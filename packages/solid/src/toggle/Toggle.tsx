import { createEffect, createUniqueId, mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../internals/createChangeEventDetails'
import { createControlled } from '../internals/createControlled'
import { createRender } from '../internals/createRender'
import { useButton } from '../internals/useButton'
import { dataAttr } from '../internals/useRender'
import { useToggleGroupContext } from '../toggle-group/ToggleGroupContext'

import { ToggleDataAttributes } from './ToggleDataAttributes'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../internals/createChangeEventDetails'
import type { RenderProp } from '../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 *
 * @param componentProps - Toggle props (`pressed`, `defaultPressed`, `onPressedChange`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Toggle } from "@script-augur/base-ui-solid/toggle"
 *
 * <Toggle defaultPressed={false} onPressedChange={(pressed) => console.log(pressed)}>
 *   Bold
 * </Toggle>
 * ```
 */
export function Toggle(componentProps: ToggleProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'pressed',
    'defaultPressed',
    'onPressedChange',
    'value',
    'ref',
  ])

  const groupContext = useToggleGroupContext()
  const generatedId = createUniqueId()
  // Match upstream: falsy `value` (including "") falls back to a generated id.
  const resolvedValue = () => local.value || generatedId

  createEffect(() => {
    if (
      groupContext &&
      local.value === undefined &&
      groupContext.isValueInitialized()
    ) {
      console.error(
        'Base UI: A `Toggle` component rendered in a `ToggleGroup` has no explicit `value` prop. This will cause issues between the Toggle Group and Toggle values. Provide the `Toggle` with a `value` prop matching the `ToggleGroup` values prop type.'
      )
    }
  })

  const [pressed, setPressed] = createControlled({
    value: () => {
      if (groupContext) {
        const value = resolvedValue()
        return groupContext.value().indexOf(value) > -1
      }
      return local.pressed
    },
    defaultValue: groupContext ? false : (local.defaultPressed ?? false),
  })

  const disabled = () => (local.disabled || groupContext?.disabled()) ?? false

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  const state: ToggleState = {
    get disabled() {
      return disabled()
    },
    get pressed() {
      return pressed()
    },
  }

  return createRender<ToggleState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          onClick(event: MouseEvent) {
            const nextPressed = !pressed()
            const details = createChangeEventDetails(REASONS.none, event)

            // `onPressedChange` runs before the group commits so that canceling
            // here can also veto the group value change (shared `details`).
            local.onPressedChange?.(nextPressed, details)
            if (details.isCanceled) return

            if (groupContext) {
              const applied = groupContext.setGroupValue(
                resolvedValue(),
                nextPressed,
                details
              )
              if (!applied) return
            }

            setPressed(nextPressed)
          },
        }) as Record<string, unknown>
      ),
      {
        get 'aria-pressed'() {
          return pressed()
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get [ToggleDataAttributes.pressed]() {
          return dataAttr(pressed())
        },
        get [ToggleDataAttributes.disabled]() {
          return dataAttr(disabled())
        },
        ref(element: HTMLElement) {
          buttonRef(element)
          const userRef = local.ref
          if (typeof userRef === 'function') {
            userRef(element as HTMLButtonElement)
          }
        },
      }
    ),
  })
}

/**
 * Public state exposed to `render` functions.
 */
export interface ToggleState extends Record<string, unknown> {
  /** Whether the toggle is currently pressed. */
  pressed: boolean
  /** Whether the toggle should ignore user interaction. */
  disabled: boolean
}

/**
 * Props for {@link Toggle}.
 */
export type ToggleProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled' | 'type' | 'form' | 'value'
> & {
  /** Toggle label / content. */
  children?: JSX.Element
  /**
   * Whether the toggle button is currently pressed.
   * Controlled counterpart of `defaultPressed`.
   */
  pressed?: boolean
  /**
   * Whether the toggle button is currently pressed.
   * Uncontrolled counterpart of `pressed`.
   * @default false
   */
  defaultPressed?: boolean
  /** Whether the component should ignore user interaction. @default false */
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  /**
   * Callback fired when the pressed state should change.
   * Call `eventDetails.cancel()` to prevent the update.
   */
  onPressedChange?: (
    pressed: boolean,
    eventDetails: ToggleChangeEventDetails
  ) => void
  /**
   * A unique string that identifies the toggle when used inside a toggle group.
   */
  value?: string
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ToggleState, Record<string, unknown>>
}

/** Change-event reason for {@link Toggle}. */
export type ToggleChangeEventReason = ChangeEventReason

/** Change-event details for {@link Toggle}. */
export type ToggleChangeEventDetails =
  BaseUIChangeEventDetails<ToggleChangeEventReason>
