import { mergeProps, splitProps } from 'solid-js'

import { createControlled } from '../internals/createControlled'
import { createRender } from '../internals/createRender'
import { dataAttr } from '../internals/useRender'

import { ToggleGroupContext } from './ToggleGroupContext'
import { ToggleGroupDataAttributes } from './ToggleGroupDataAttributes'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../internals/createChangeEventDetails'
import type { RenderProp } from '../internals/createRender'
import type { Orientation } from '../separator/Separator'
import type { JSX } from 'solid-js'

const EMPTY_ARRAY: ReadonlyArray<string> = []

/**
 * Provides shared pressed state to a series of toggle buttons.
 * Renders a `<div>` with `role="group"`.
 *
 * Documentation: [Base UI Toggle Group](https://base-ui.com/react/components/toggle-group)
 *
 * @param componentProps - Toggle group props (`value`, `multiple`, `orientation`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { ToggleGroup } from "@script-augur/base-ui-solid/toggle-group"
 * import { Toggle } from "@script-augur/base-ui-solid/toggle"
 *
 * <ToggleGroup defaultValue={["bold"]}>
 *   <Toggle value="bold">Bold</Toggle>
 *   <Toggle value="italic">Italic</Toggle>
 * </ToggleGroup>
 * ```
 */
export function ToggleGroup(componentProps: ToggleGroupProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'loopFocus',
    'onValueChange',
    'orientation',
    'multiple',
    'value',
    'defaultValue',
    'ref',
  ])

  const disabled = () => local.disabled ?? false
  const multiple = () => local.multiple ?? false
  const orientation = () => local.orientation ?? 'horizontal'
  const isValueInitialized = () =>
    local.value !== undefined || local.defaultValue !== undefined

  const [groupValue, groupValueAssign] = createControlled({
    value: () => local.value,
    defaultValue: local.defaultValue ?? EMPTY_ARRAY,
  })

  const setGroupValue = (
    newValue: string,
    nextPressed: boolean,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ): boolean => {
    const current = groupValue()
    let newGroupValue: Array<string>

    if (multiple()) {
      newGroupValue = current.slice()
      if (nextPressed) {
        newGroupValue.push(newValue)
      } else {
        const index = current.indexOf(newValue)
        if (index !== -1) {
          newGroupValue.splice(index, 1)
        }
      }
    } else {
      newGroupValue = nextPressed ? [newValue] : []
    }

    local.onValueChange?.(newGroupValue, eventDetails)

    if (eventDetails.isCanceled) {
      return false
    }

    groupValueAssign(newGroupValue)
    return true
  }

  const state: ToggleGroupState = {
    get disabled() {
      return disabled()
    },
    get multiple() {
      return multiple()
    },
    get orientation() {
      return orientation()
    },
  }

  const contextValue = {
    value: groupValue,
    setGroupValue,
    disabled,
    isValueInitialized,
  }

  // `loopFocus` is accepted for API parity with Base UI; roving tabindex /
  // CompositeRoot is not ported in this vertical slice.
  void local.loopFocus

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      {createRender<ToggleGroupState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get role() {
            return 'group' as const
          },
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get [ToggleGroupDataAttributes.disabled]() {
            return dataAttr(disabled())
          },
          get [ToggleGroupDataAttributes.orientation]() {
            return orientation()
          },
          get [ToggleGroupDataAttributes.multiple]() {
            return dataAttr(multiple())
          },
          ref: local.ref,
        }),
      })}
    </ToggleGroupContext.Provider>
  )
}

/**
 * Public state exposed to `render` functions.
 */
export interface ToggleGroupState extends Record<string, unknown> {
  /** Whether the group ignores user interaction. */
  disabled: boolean
  /**
   * When `false`, only one item can be pressed.
   * When `true`, multiple items can be pressed.
   */
  multiple: boolean
  /** Layout / arrow-key orientation of the group. */
  orientation: Orientation
}

/**
 * Props for {@link ToggleGroup}.
 */
export type ToggleGroupProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> & {
  /**
   * Pressed toggle values (controlled).
   * Counterpart of `defaultValue`.
   */
  value?: ReadonlyArray<string>
  /**
   * Initial pressed toggle values (uncontrolled).
   * Counterpart of `value`.
   */
  defaultValue?: ReadonlyArray<string>
  /**
   * Fired when the pressed set should change.
   * Call `eventDetails.cancel()` to prevent the update.
   */
  onValueChange?: (
    groupValue: Array<string>,
    eventDetails: ToggleGroupChangeEventDetails
  ) => void
  /** Whether the group ignores user interaction. @default false */
  disabled?: boolean
  /**
   * Orientation of the toggle group.
   * @default 'horizontal'
   */
  orientation?: Orientation
  /**
   * Whether to loop keyboard focus at the ends of the list.
   * Accepted for API parity; roving focus is not implemented in this slice.
   * @default true
   */
  loopFocus?: boolean
  /**
   * When `false`, only one item can be pressed at a time.
   * When `true`, multiple items can be pressed.
   * @default false
   */
  multiple?: boolean
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ToggleGroupState, Record<string, unknown>>
}

/** Change-event reason for {@link ToggleGroup}. */
export type ToggleGroupChangeEventReason = ChangeEventReason

/** Change-event details for {@link ToggleGroup}. */
export type ToggleGroupChangeEventDetails =
  BaseUIChangeEventDetails<ToggleGroupChangeEventReason>

export type { Orientation }
