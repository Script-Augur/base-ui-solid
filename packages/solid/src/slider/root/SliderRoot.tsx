import { activeElement, clamp, contains, ownerDocument } from '@script-augur/base-ui-utils'
import {
  children,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  mergeProps,
  splitProps,
} from 'solid-js'

import { CompositeList } from '../../internals/composite/list/CompositeList'
import {
  REASONS,
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'
import { createRegisterFieldControl } from '../../internals/field-register-control/createRegisterFieldControl'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { useFormContext } from '../../internals/form-context/FormContext'
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext'
import { asc } from '../utils/asc'
import { getSliderValue } from '../utils/getSliderValue'
import { validateMinimumDistance } from '../utils/validateMinimumDistance'

import { SliderRootContext } from './SliderRootContext'
import { sliderStateAttributesMapping } from './stateAttributesMapping'

import type { SliderRootContextValue } from './SliderRootContext'
import type { FieldRootState } from '../../field/root/FieldRoot'
import type { CompositeMetadata } from '../../internals/composite/list/CompositeList'
import type {
  BaseUIChangeEventDetails,
  BaseUIGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { Orientation } from '../../separator/Separator'
import type { ThumbMetadata } from '../thumb/SliderThumb'
import type { JSX } from 'solid-js'
/**
 * Groups all parts of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderRoot<
  TValue extends number | ReadonlyArray<number> = number | ReadonlyArray<number>,
>(componentProps: SliderRootProps<TValue>): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'aria-labelledby',
    'defaultValue',
    'disabled',
    'id',
    'format',
    'largeStep',
    'locale',
    'max',
    'min',
    'minStepsBetweenValues',
    'form',
    'name',
    'onValueChange',
    'onValueCommitted',
    'orientation',
    'step',
    'thumbCollisionBehavior',
    'thumbAlignment',
    'value',
    'children',
    'ref',
  ])

  const generatedId = createUniqueId()
  const id = () => local.id ?? generatedId
  const defaultLabelId = () => getDefaultLabelId(id())

  const largeStep = () => local.largeStep ?? 10
  const max = () => local.max ?? 100
  const min = () => local.min ?? 0
  const minStepsBetweenValues = () => local.minStepsBetweenValues ?? 0
  const orientation = () => local.orientation ?? 'horizontal'
  const step = () => local.step ?? 1
  const thumbCollisionBehavior = () => local.thumbCollisionBehavior ?? 'push'
  const thumbAlignment = () => local.thumbAlignment ?? 'center'
  const format = () => local.format
  const locale = () => local.locale
  const form = () => local.form

  const { clearErrors } = useFormContext()
  const field = useFieldRootContext()
  const { labelId: fieldLabelId } = useLabelableContext()
  const [labelId, labelIdAssign] = createSignal<string | undefined>()

  const ariaLabelledby = () =>
    local['aria-labelledby'] ?? fieldLabelId() ?? labelId()
  const disabled = () => field.disabled() || Boolean(local.disabled)
  const name = () => field.name() ?? local.name

  const [valueUnwrapped, valueAssign] = createControlled<
    number | ReadonlyArray<number>
  >({
    value: () => local.value,
    defaultValue: (local.defaultValue ?? min()),
  })

  const sliderRef: { current: HTMLElement | null } = { current: null }
  const controlRef: { current: HTMLElement | null } = { current: null }
  const thumbRefs: { current: Array<HTMLElement | null> } = { current: [] }
  const pressedThumbCenterOffsetRef: { current: number | null } = {
    current: null,
  }
  const pressedThumbIndexRef: { current: number } = { current: -1 }
  const pressedValuesRef: { current: ReadonlyArray<number> | null } = {
    current: null,
  }
  const lastChangeReasonRef: {
    current: SliderRootChangeEventReason
  } = { current: REASONS.none }

  const [active, activeAssign] = createSignal(-1)
  const [lastUsedThumbIndex, lastUsedThumbIndexAssign] = createSignal(-1)
  const [dragging, draggingAssign] = createSignal(false)
  const [thumbMap, thumbMapAssign] = createSignal(
    new Map<Node, CompositeMetadata<ThumbMetadata>>()
  )
  const [indicatorPosition, indicatorPositionAssign] = createSignal<
    Array<number | undefined>
  >([undefined, undefined])

  function setActive(value: number) {
    activeAssign(value)
    if (value !== -1) {
      lastUsedThumbIndexAssign(value)
    }
  }

  function registerFieldControlRef(element: Element | null | undefined) {
    if (element) {
      controlRef.current = element as HTMLElement
    }
  }

  const range = () => Array.isArray(valueUnwrapped())

  const values = createMemo(() => {
    const unwrapped = valueUnwrapped()
    if (!Array.isArray(unwrapped)) {
      return [clamp(unwrapped as number, min(), max())]
    }
    return unwrapped.map(value => clamp(value, min(), max())).sort(asc)
  })

  const fieldValue = (): number | ReadonlyArray<number> => {
    const nextValues = values()
    if (range()) {
      return nextValues
    }
    return nextValues[0] ?? min()
  }

  // Register the nested range input (Thumb writes `validation.inputRef`), not
  // the Control surface — Form.focusFirstInvalid focuses `field.controlRef`.
  createRegisterFieldControl({
    controlRef: field.validation.inputRef,
    id,
    value: fieldValue,
    enabled: () => !disabled(),
    name: () => local.name,
  })

  // Mirror React `useValueChanged` / Switch prev-value gating: skip mount, and
  // only read `validityData` inside the gated branch so validation commits
  // cannot re-enter this effect.
  createEffect(
    (prev: number | ReadonlyArray<number> | undefined) => {
      const next = fieldValue()
      if (prev !== undefined && !areValuesEqual(next, prev)) {
        clearErrors(name())
        field.validation.change(next)

        const initialValue = field.validityData().initialValue as
          | number
          | ReadonlyArray<number>
          | undefined
        let isDirty: boolean
        if (Array.isArray(next) && Array.isArray(initialValue)) {
          isDirty = !areArraysEqual(next, initialValue)
        } else {
          isDirty = next !== initialValue
        }
        field.dirtyAssign(isDirty)
      }
      return next
    }
  )

  function setValue(
    newValue: number | Array<number>,
    details: SliderRootChangeEventDetails
  ): boolean {
    if (Number.isNaN(newValue) || areValuesEqual(newValue, valueUnwrapped())) {
      return false
    }

    const nativeEvent = details.event
    if (nativeEvent) {
      const EventConstructor = nativeEvent.constructor as typeof Event
      const clonedEvent = new EventConstructor(nativeEvent.type, nativeEvent)

      Object.defineProperty(clonedEvent, 'target', {
        writable: true,
        value: { value: newValue, name: name() },
      })

      details.event = clonedEvent
    }

    ;(
      local.onValueChange as
        | ((
            value: number | Array<number>,
            eventDetails: SliderRootChangeEventDetails
          ) => void)
        | undefined
    )?.(newValue, details)

    if (details.isCanceled) {
      return false
    }

    lastChangeReasonRef.current = details.reason
    valueAssign(newValue)
    return true
  }

  function handleInputChange(
    valueInput: number,
    index: number,
    event: KeyboardEvent | Event
  ) {
    const newValue = getSliderValue(
      valueInput,
      index,
      min(),
      max(),
      range(),
      values()
    )

    if (validateMinimumDistance(newValue, step(), minStepsBetweenValues())) {
      const reason =
        'key' in event ? REASONS.keyboard : REASONS.inputChange
      const applied = setValue(
        newValue,
        createChangeEventDetails(reason, event, undefined, {
          activeThumbIndex: index,
        })
      )
      field.touchedAssign(true)

      if (applied) {
        ;(
          local.onValueCommitted as
            | ((
                value: number | ReadonlyArray<number>,
                eventDetails: SliderRootCommitEventDetails
              ) => void)
            | undefined
        )?.(newValue, createGenericEventDetails(reason, event))
      }
    }
  }

  createEffect(() => {
    if (min() >= max()) {
      console.warn('Base UI: Slider `max` must be greater than `min`.')
    }
  })

  createEffect(() => {
    if (!disabled()) return

    const activeEl = activeElement(ownerDocument(sliderRef.current))
    if (contains(sliderRef.current, activeEl)) {
      ;(activeEl as HTMLElement).blur()
    }

    if (active() !== -1) {
      setActive(-1)
    }
  })

  const state: SliderRootState = {
    get activeThumbIndex() {
      return active()
    },
    get disabled() {
      return disabled()
    },
    get dragging() {
      return dragging()
    },
    get orientation() {
      return orientation()
    },
    get max() {
      return max()
    },
    get min() {
      return min()
    },
    get minStepsBetweenValues() {
      return minStepsBetweenValues()
    },
    get step() {
      return step()
    },
    get values() {
      return values()
    },
    get touched() {
      return field.state.touched
    },
    get dirty() {
      return field.state.dirty
    },
    get valid() {
      return field.state.valid
    },
    get filled() {
      return field.state.filled
    },
    get focused() {
      return field.state.focused
    },
  }

  const contextValue: SliderRootContextValue = {
    active,
    lastUsedThumbIndex,
    controlRef,
    dragging,
    disabled,
    validation: field.validation,
    format,
    handleInputChange,
    indicatorPosition,
    inset: () => thumbAlignment() !== 'center',
    labelId: ariaLabelledby,
    rootLabelId: defaultLabelId,
    largeStep,
    lastChangeReasonRef,
    form,
    locale,
    max,
    min,
    minStepsBetweenValues,
    name,
    onValueCommitted: (newValue, data) => {
      ;(
        local.onValueCommitted as
          | ((
              value: number | ReadonlyArray<number>,
              eventDetails: SliderRootCommitEventDetails
            ) => void)
          | undefined
      )?.(newValue, data)
    },
    orientation,
    pressedThumbCenterOffsetRef,
    pressedThumbIndexRef,
    pressedValuesRef,
    renderBeforeHydration: () => thumbAlignment() === 'edge',
    registerFieldControlRef,
    activeAssign: setActive,
    draggingAssign,
    indicatorPositionAssign,
    labelIdAssign,
    setValue,
    state,
    step,
    thumbCollisionBehavior,
    thumbMap,
    thumbRefs,
    values,
  }

  return (
    <SliderRootContext.Provider value={contextValue}>
      <CompositeList
        elementsRef={thumbRefs}
        onMapChange={map => {
          thumbMapAssign(map as Map<Node, CompositeMetadata<ThumbMetadata>>)
        }}
      >
        <SliderRootHost
          state={state}
          render={local.render}
          class={local.class}
          style={local.style}
          elementProps={elementProps}
          ref={local.ref}
          ariaLabelledby={ariaLabelledby}
          id={id}
          disabled={disabled}
          validation={field.validation}
          sliderRef={sliderRef}
        >
          {local.children}
        </SliderRootHost>
      </CompositeList>
    </SliderRootContext.Provider>
  )
}

export interface SliderRootState extends FieldRootState {
  /**
   * The index of the active thumb.
   */
  activeThumbIndex: number
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean
  /**
   * Whether the thumb is currently being dragged.
   */
  dragging: boolean
  /**
   * The maximum value.
   */
  max: number
  /**
   * The minimum value.
   */
  min: number
  /**
   * The minimum steps between values in a range slider.
   * @default 0
   */
  minStepsBetweenValues: number
  /**
   * The component orientation.
   */
  orientation: Orientation
  /**
   * The step increment of the slider when incrementing or decrementing. It will snap
   * to multiples of this value. Decimal values are supported.
   * @default 1
   */
  step: number
  /**
   * The raw number value of the slider.
   */
  values: ReadonlyArray<number>
}
export interface SliderRootProps<
  TValue extends number | ReadonlyArray<number> = number | ReadonlyArray<number>,
> extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange' | 'value' | 'children' | 'color'
> {
  render?: RenderProp<SliderRootState, Record<string, unknown>>
  /**
   * The uncontrolled value of the slider when it's initially rendered.
   *
   * To render a controlled slider, use the `value` prop instead.
   */
  defaultValue?: TValue | undefined
  /**
   * Whether the slider should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Options to format the value.
   */
  format?: Intl.NumberFormatOptions | undefined
  /**
   * The locale used by `Intl.NumberFormat` when formatting the value.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined
  /**
   * The maximum allowed value of the slider.
   * Should not be equal to min.
   * @default 100
   */
  max?: number | undefined
  /**
   * The minimum allowed value of the slider.
   * Should not be equal to max.
   * @default 0
   */
  min?: number | undefined
  /**
   * The minimum steps between values in a range slider.
   * @default 0
   */
  minStepsBetweenValues?: number | undefined
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined
  /**
   * Identifies the form that owns the slider inputs.
   * Useful when the slider is rendered outside the form.
   */
  form?: string | undefined
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined
  /**
   * The granularity with which the slider can step through values. (A "discrete" slider.)
   * The `min` prop serves as the origin for the valid values.
   * We recommend (max - min) to be evenly divisible by the step.
   * @default 1
   */
  step?: number | undefined
  /**
   * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
   * @default 10
   */
  largeStep?: number | undefined
  /**
   * How the thumb(s) are aligned relative to `Slider.Control` when the value is at `min` or `max`:
   * - `center`: The center of the thumb is aligned with the control edge
   * - `edge`: The thumb is inset within the control such that its edge is aligned with the control edge
   * - `edge-client-only`: Same as `edge` but without SSR prehydration (Solid has no prehydration script)
   * @default 'center'
   */
  thumbAlignment?: 'center' | 'edge' | 'edge-client-only' | undefined
  /**
   * Controls how thumbs behave when they collide during pointer interactions.
   *
   * - `'push'` (default): Thumbs push each other without restoring their previous positions when dragged back.
   * - `'swap'`: Thumbs swap places when dragged past each other.
   * - `'none'`: Thumbs cannot move past each other; excess movement is ignored.
   *
   * @default 'push'
   */
  thumbCollisionBehavior?: 'push' | 'swap' | 'none' | undefined
  /**
   * The value of the slider.
   * For range sliders, provide an array with one value per thumb.
   */
  value?: TValue | undefined
  /**
   * Callback function that is fired when the slider's value changed.
   */
  onValueChange?:
    | ((
        value: TValue extends number ? number : TValue,
        eventDetails: SliderRootChangeEventDetails
      ) => void)
    | undefined
  /**
   * Callback function that is fired when a value change is committed.
   */
  onValueCommitted?:
    | ((
        value: TValue extends number ? number : TValue,
        eventDetails: SliderRootCommitEventDetails
      ) => void)
    | undefined
  children?: JSX.Element
}
export interface SliderRootChangeEventCustomProperties {
  /**
   * The index of the active thumb at the time of the change.
   */
  activeThumbIndex: number
}
export type SliderRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.trackPress
  | typeof REASONS.drag
  | typeof REASONS.keyboard
  | typeof REASONS.none
export type SliderRootChangeEventDetails = BaseUIChangeEventDetails<
  SliderRootChangeEventReason
> &
  SliderRootChangeEventCustomProperties
export type SliderRootCommitEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.trackPress
  | typeof REASONS.drag
  | typeof REASONS.keyboard
  | typeof REASONS.none
export type SliderRootCommitEventDetails =
  BaseUIGenericEventDetails<SliderRootCommitEventReason>

/**
 * Renders the slider root host under context so memoized children still see the
 * provider, while `children()` prevents `data-*` updates from remounting Control/Thumb.
 */
function SliderRootHost(props: {
  state: SliderRootState
  render: SliderRootProps['render']
  class: SliderRootProps['class']
  style: SliderRootProps['style']
  elementProps: Record<string, unknown>
  ref: SliderRootProps['ref']
  ariaLabelledby: () => string | undefined
  id: () => string
  disabled: () => boolean
  validation: ReturnType<typeof useFieldRootContext>['validation']
  sliderRef: { current: HTMLElement | null }
  children?: JSX.Element
}): JSX.Element {
  const resolvedChildren = children(() => props.children)

  return createRender<SliderRootState, Record<string, unknown>>({
    defaultElement: 'div',
    state: props.state,
    render: props.render,
    ref: [
      element => {
        props.sliderRef.current = element as HTMLElement | null
      },
      props.ref as never,
    ],
    stateAttributesMapping: sliderStateAttributesMapping,
    props: mergeProps(
      props.elementProps,
      {
        get 'aria-labelledby'() {
          return props.ariaLabelledby()
        },
        get id() {
          return props.id()
        },
        get role() {
          return 'group' as const
        },
        get class() {
          return props.class
        },
        get style() {
          return props.style
        },
        get children() {
          return resolvedChildren()
        },
      },
      props.validation.getValidationProps(props.disabled())
    ),
  })
}

function areArraysEqual(
  a: ReadonlyArray<number>,
  b: ReadonlyArray<number>
): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}
function areValuesEqual(
  newValue: number | ReadonlyArray<number>,
  oldValue: number | ReadonlyArray<number>
): boolean {
  return (
    newValue === oldValue ||
    (Array.isArray(newValue) &&
      Array.isArray(oldValue) &&
      areArraysEqual(newValue, oldValue))
  )
}
function getDefaultLabelId(id: string | null | undefined): string | undefined {
  return id == null ? undefined : `${id}-label`
}
