import { createContext, useContext } from 'solid-js'

import type { SliderRootChangeEventDetails, SliderRootCommitEventDetails, SliderRootState } from './SliderRoot'
import type { CreateFieldValidationReturnValue } from '../../field/root/createFieldValidation'
import type { CompositeMetadata } from '../../internals/composite/list/CompositeList'
import type { Orientation } from '../../separator/Separator'
import type { ThumbMetadata } from '../thumb/SliderThumb'
import type { Accessor, Setter } from 'solid-js'

export const SliderRootContext = createContext<
  SliderRootContextValue | undefined
>(undefined)
/**
 * Reads the nearest Slider root context.
 *
 * @throws If used outside `<Slider.Root>`.
 */
export function useSliderRootContext(): SliderRootContextValue {
  const context = useContext(SliderRootContext)
  if (context === undefined) {
    throw new Error(
      'Base UI: SliderRootContext is missing. Slider parts must be placed within <Slider.Root>.'
    )
  }
  return context
}
export interface SliderRootContextValue {
  /**
   * The index of the active thumb.
   */
  active: Accessor<number>
  /**
   * The index of the most recently interacted thumb.
   */
  lastUsedThumbIndex: Accessor<number>
  controlRef: { current: HTMLElement | null }
  dragging: Accessor<boolean>
  disabled: Accessor<boolean>
  validation: CreateFieldValidationReturnValue
  /**
   * Options to format the value.
   */
  format: Accessor<Intl.NumberFormatOptions | undefined>
  handleInputChange: (
    valueInput: number,
    index: number,
    event: KeyboardEvent | Event
  ) => void
  indicatorPosition: Accessor<Array<number | undefined>>
  inset: Accessor<boolean>
  labelId: Accessor<string | undefined>
  rootLabelId: Accessor<string | undefined>
  /**
   * The large step value of the slider when incrementing or decrementing while the shift key is held,
   * or when using Page-Up or Page-Down keys. Snaps to multiples of this value.
   * @default 10
   */
  largeStep: Accessor<number>
  lastChangeReasonRef: { current: SliderRootChangeEventDetails['reason'] }
  /**
   * The locale used by `Intl.NumberFormat` when formatting the value.
   * Defaults to the user's runtime locale.
   */
  locale: Accessor<Intl.LocalesArgument | undefined>
  /**
   * The maximum allowed value of the slider.
   */
  max: Accessor<number>
  /**
   * The minimum allowed value of the slider.
   */
  min: Accessor<number>
  /**
   * The minimum steps between values in a range slider.
   */
  minStepsBetweenValues: Accessor<number>
  form: Accessor<string | undefined>
  name: Accessor<string | undefined>
  /**
   * Function to be called when drag ends and the pointer is released.
   */
  onValueCommitted: (
    newValue: number | ReadonlyArray<number>,
    data: SliderRootCommitEventDetails
  ) => void
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation: Accessor<Orientation>
  pressedThumbCenterOffsetRef: { current: number | null }
  pressedThumbIndexRef: { current: number }
  pressedValuesRef: { current: ReadonlyArray<number> | null }
  renderBeforeHydration: Accessor<boolean>
  registerFieldControlRef: (element: Element | null | undefined) => void
  activeAssign: (index: number) => void
  draggingAssign: Setter<boolean>
  indicatorPositionAssign: Setter<Array<number | undefined>>
  labelIdAssign: Setter<string | undefined>
  /**
   * Applies a new value through `onValueChange` for keyboard, input, track-press,
   * and drag interactions. Returns `true` when the value was applied, or `false`
   * when it was invalid (NaN), unchanged, or the change was canceled.
   */
  setValue: (
    newValue: number | Array<number>,
    details: SliderRootChangeEventDetails
  ) => boolean
  state: SliderRootState
  /**
   * The step increment of the slider when incrementing or decrementing. It will snap
   * to multiples of this value. Decimal values are supported.
   * @default 1
   */
  step: Accessor<number>
  thumbCollisionBehavior: Accessor<'push' | 'swap' | 'none'>
  thumbMap: Accessor<Map<Node, CompositeMetadata<ThumbMetadata>>>
  thumbRefs: { current: Array<HTMLElement | null> }
  /**
   * The value(s) of the slider
   */
  values: Accessor<ReadonlyArray<number>>
}
