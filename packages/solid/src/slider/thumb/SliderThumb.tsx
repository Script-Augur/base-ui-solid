import {
  clamp,
  contains,
  formatNumber,
  ownerWindow,
  valueToPercent,
  visuallyHidden,
} from '@script-augur/base-ui-utils'
import {
  children,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  COMPOSITE_KEYS,
  END,
  HOME,
  PAGE_DOWN,
  PAGE_UP,
} from '../../internals/composite/composite'
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem'
import { createRender } from '../../internals/createRender'
import { useDirection } from '../../internals/direction'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { createLabelableId } from '../../internals/labelable-provider/createLabelableId'
import { mergeRefs } from '../../internals/mergeRefs'
import { useSliderRootContext } from '../root/SliderRootContext'
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping'
import { getMidpoint } from '../utils/getMidpoint'
import { getSliderValue } from '../utils/getSliderValue'
import {
  getDecimalPrecision,
  roundValueToStep,
} from '../utils/roundValueToStep'

import { SliderThumbDataAttributes } from './SliderThumbDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { SliderRootState } from '../root/SliderRoot'
import type { JSX } from 'solid-js'

const ALL_KEYS = new Set([...COMPOSITE_KEYS, PAGE_UP, PAGE_DOWN])
/**
 * The draggable part of the slider at the tip of the indicator.
 * Renders a `<div>` element and a nested `<input type="range">`.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderThumb(componentProps: SliderThumbProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'aria-describedby',
    'aria-label',
    'aria-labelledby',
    'aria-valuetext',
    'disabled',
    'getAriaLabel',
    'getAriaValueText',
    'id',
    'index',
    'inputRef',
    'onBlur',
    'onFocus',
    'onKeyDown',
    'tabIndex',
    'ref',
  ])

  const generatedId = createUniqueId()
  const id = () => local.id ?? generatedId

  const {
    active: activeIndex,
    lastUsedThumbIndex,
    controlRef,
    disabled: contextDisabled,
    validation,
    format,
    handleInputChange,
    inset,
    labelId,
    largeStep,
    locale,
    max,
    min,
    minStepsBetweenValues,
    form,
    name,
    orientation,
    pressedThumbCenterOffsetRef,
    pressedThumbIndexRef,
    renderBeforeHydration,
    activeAssign,
    indicatorPositionAssign,
    state,
    step,
    thumbRefs,
    values: sliderValues,
  } = useSliderRootContext()

  const direction = useDirection()
  const field = useFieldRootContext()

  const disabled = () => Boolean(local.disabled) || contextDisabled()
  const range = () => sliderValues().length > 1
  const vertical = () => orientation() === 'vertical'
  const rtl = () => direction() === 'rtl'

  const thumbRef: { current: HTMLElement | null } = { current: null }
  const inputRef: { current: HTMLInputElement | null } = { current: null }
  const restoringFocusVisibleRef = { current: false }

  const defaultInputId = createUniqueId()
  const labelableId = createLabelableId({
    id: () => (range() ? undefined : defaultInputId),
    implicit: () => !range(),
  })
  const inputId = () =>
    range() ? defaultInputId : (labelableId() ?? defaultInputId)

  const thumbMetadata = createMemo(() => ({
    inputId: inputId(),
  }))

  const { refAssign: listItemRefAssign, index: compositeIndex } =
    useCompositeListItem<ThumbMetadata>({
      metadata: thumbMetadata,
      index: local.index,
    })

  const index = () => (!range() ? 0 : (local.index ?? compositeIndex()))
  const last = () => index() === sliderValues().length - 1
  const thumbValue = () => sliderValues()[index()]!
  const thumbValuePercent = () => valueToPercent(thumbValue(), min(), max())

  const [positionPercent, positionPercentAssign] = createSignal<
    number | undefined
  >()

  void renderBeforeHydration

  function getInsetPosition() {
    const control = controlRef.current
    const thumb = thumbRef.current
    if (!control || !thumb) {
      return
    }

    const thumbRect = thumb.getBoundingClientRect()
    const controlRect = control.getBoundingClientRect()

    const side = vertical() ? 'height' : 'width'
    const controlSize = controlRect[side] - thumbRect[side]
    const thumbOffsetFromControlEdge =
      thumbRect[side] / 2 + (controlSize * thumbValuePercent()) / 100
    const nextPositionPercent =
      (thumbOffsetFromControlEdge / controlRect[side]) * 100
    const nextInsetPosition = Number.isFinite(nextPositionPercent)
      ? nextPositionPercent
      : undefined

    positionPercentAssign(nextInsetPosition)

    if (index() === 0) {
      indicatorPositionAssign(prevPosition => [
        nextInsetPosition,
        prevPosition[1],
      ])
    } else if (last()) {
      indicatorPositionAssign(prevPosition => [
        prevPosition[0],
        nextInsetPosition,
      ])
    }
  }

  createEffect(() => {
    if (inset()) {
      queueMicrotask(getInsetPosition)
    }
  })

  createEffect(() => {
    if (inset()) {
      thumbValuePercent()
      getInsetPosition()
    }
  })

  createEffect(() => {
    if (!inset()) {
      return
    }

    const control = controlRef.current
    const thumb = thumbRef.current

    if (!control || !thumb) {
      return
    }

    const ResizeObserverCtor = (
      ownerWindow(control) as Window & {
        ResizeObserver?: typeof ResizeObserver
      }
    ).ResizeObserver
    if (typeof ResizeObserverCtor !== 'function') {
      return
    }

    const resizeObserver = new ResizeObserverCtor(getInsetPosition)

    resizeObserver.observe(control)
    resizeObserver.observe(thumb)

    onCleanup(() => {
      resizeObserver.disconnect()
    })
  })

  const thumbStyle = (): JSX.CSSProperties => {
    const startEdge = vertical() ? 'bottom' : 'inset-inline-start'
    const crossOffsetProperty = vertical() ? 'left' : 'top'
    const percent = thumbValuePercent()
    const isInset = inset()

    const safeLastUsedThumbIndex =
      lastUsedThumbIndex() >= 0 &&
      lastUsedThumbIndex() < sliderValues().length
        ? lastUsedThumbIndex()
        : -1

    let zIndex: number | undefined
    if (range()) {
      if (activeIndex() === index()) {
        zIndex = 2
      } else if (safeLastUsedThumbIndex === index()) {
        zIndex = 1
      }
    } else if (activeIndex() === index()) {
      zIndex = 1
    }

    if (!isInset && !Number.isFinite(percent)) {
      return { ...visuallyHidden }
    }

    const styles: JSX.CSSProperties & Record<string, unknown> = {
      position: 'absolute',
      [startEdge]: isInset ? 'var(--position)' : `${percent}%`,
      [crossOffsetProperty]: '50%',
      translate: `${(vertical() || !rtl() ? -1 : 1) * 50}% ${(vertical() ? 1 : -1) * 50}%`,
      zIndex,
    }

    if (isInset) {
      styles['--position'] = `${positionPercent() ?? 0}%`
      styles.visibility =
        positionPercent() === undefined ? ('hidden' as const) : undefined
    }

    const userStyle = local.style
    if (userStyle == null) return styles
    if (typeof userStyle === 'string') {
      return userStyle as unknown as JSX.CSSProperties
    }
    return { ...styles, ...userStyle }
  }

  createEffect(() => {
    const el = inputRef.current
    const next = thumbValue()
    if (el && el.value !== String(next)) {
      el.value = String(next)
    }
  })

  const cssWritingMode = (): JSX.CSSProperties['writing-mode'] | undefined => {
    if (!vertical()) return undefined
    return rtl() ? 'vertical-rl' : 'vertical-lr'
  }

  const ariaLabel = () =>
    typeof local.getAriaLabel === 'function'
      ? local.getAriaLabel(index())
      : local['aria-label']

  const mergedInputRef = mergeRefs(
    element => {
      inputRef.current = element as HTMLInputElement | null
      validation.inputRef.current = element as HTMLInputElement | null
    },
    local.inputRef as never
  )

  // Freeze nested range input across `data-*` / style updates on the thumb host.
  // Re-reading a raw children getter remounts the input and drops key listeners.
  const resolvedThumbContents = children(() => (
    <>
      {local.children}
      <SliderThumbRangeInput
        assignRef={mergedInputRef}
        ariaLabel={ariaLabel}
        ariaLabelledBy={() =>
          local['aria-labelledby'] ??
          (ariaLabel() == null ? labelId() : undefined)
        }
        ariaDescribedBy={() =>
          (validation.getValidationProps(disabled(), {
            'aria-describedby': local['aria-describedby'],
          })['aria-describedby'] as string | undefined) ??
          local['aria-describedby']
        }
        ariaInvalid={() =>
          validation.getValidationProps(disabled())['aria-invalid'] as
            | boolean
            | undefined
        }
        orientation={orientation}
        thumbValue={thumbValue}
        ariaValueText={() =>
          typeof local.getAriaValueText === 'function'
            ? local.getAriaValueText(
                formatNumber(thumbValue(), locale(), format()),
                thumbValue(),
                index()
              )
            : (local['aria-valuetext'] ??
              getDefaultAriaValueText(
                sliderValues(),
                index(),
                format(),
                locale()
              ))
        }
        disabled={disabled}
        form={form}
        inputId={inputId}
        max={max}
        min={min}
        name={name}
        step={step}
        tabIndex={() => local.tabIndex}
        writingMode={cssWritingMode}
        onUserKeyDown={event => local.onKeyDown?.(event)}
        onUserFocus={event => local.onFocus?.(event)}
        onUserBlur={event => local.onBlur?.(event)}
        onValueInput={(valueInput, event) => {
          handleInputChange(valueInput, index(), event)
        }}
        onFocusThumb={() => {
          activeAssign(index())
          field.focusedAssign(true)
        }}
        onBlurThumb={relatedTarget => {
          activeAssign(-1)
          if (
            thumbRefs.current.some(thumb =>
              contains(thumb, relatedTarget as Node | null)
            )
          ) {
            return 'skip-field'
          }
          field.touchedAssign(true)
          field.focusedAssign(false)
          if (field.validationMode() === 'onBlur') {
            void validation.commit(
              getSliderValue(
                thumbValue(),
                index(),
                min(),
                max(),
                range(),
                sliderValues()
              )
            )
          }
          return 'commit-field'
        }}
        resolveKeyValue={event =>
          resolveThumbKeyValue({
            event,
            thumbValue: thumbValue(),
            values: sliderValues(),
            index: index(),
            range: range(),
            rtl: rtl(),
            step: step(),
            largeStep: largeStep(),
            min: min(),
            max: max(),
            minStepsBetweenValues: minStepsBetweenValues(),
          })
        }
        syncValue={() => thumbValue()}
        restoringFocusVisibleRef={restoringFocusVisibleRef}
      />
    </>
  ))

  const hostProps = mergeProps(elementProps as Record<string, unknown>, {
    get [SliderThumbDataAttributes.index]() {
      return String(index())
    },
    get id() {
      return id()
    },
    get class() {
      return local.class
    },
    get style() {
      return thumbStyle()
    },
    onPointerDown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
      if (disabled()) {
        return
      }

      pressedThumbIndexRef.current = index()
      const midpoint = getMidpoint(event.currentTarget, vertical())
      pressedThumbCenterOffsetRef.current =
        (vertical() ? event.clientY : event.clientX) - midpoint
    },
    get children() {
      return resolvedThumbContents()
    },
  })

  return createRender<SliderThumbState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    stateAttributesMapping: sliderStateAttributesMapping,
    ref: [
      element => {
        thumbRef.current = element as HTMLElement | null
        listItemRefAssign(element as HTMLElement | null)
      },
      local.ref as never,
    ],
    props: hostProps,
  })
}


export interface ThumbMetadata {
  inputId: string | null | undefined
}
/** Public state exposed to `render` functions. */
export interface SliderThumbState extends SliderRootState {}
/** Props for {@link SliderThumb}. */
export type SliderThumbProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'onBlur' | 'onFocus' | 'onKeyDown' | 'color'
> & {
  render?: RenderProp<SliderThumbState, Record<string, unknown>>
  /**
   * Whether the thumb should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * A string value forwarded to the `aria-valuetext` attribute of the `input`.
   * Ignored when `getAriaValueText` is provided.
   */
  'aria-valuetext'?: string | undefined
  /**
   * A function which returns a string value for the `aria-label` attribute of the `input`.
   */
  getAriaLabel?: ((index: number) => string) | null | undefined
  /**
   * A function which returns a string value for the `aria-valuetext` attribute of the `input`.
   */
  getAriaValueText?:
    | ((formattedValue: string, value: number, index: number) => string)
    | null
    | undefined
  /**
   * The index of the thumb which corresponds to the index of its value in the
   * `value` or `defaultValue` array.
   */
  index?: number | undefined
  /**
   * A ref to access the nested input element.
   */
  inputRef?: ((element: HTMLInputElement | null) => void) | undefined
  /**
   * A blur handler forwarded to the `input`.
   */
  onBlur?:
    | ((event: FocusEvent & { currentTarget: HTMLInputElement }) => void)
    | undefined
  /**
   * A focus handler forwarded to the `input`.
   */
  onFocus?:
    | ((event: FocusEvent & { currentTarget: HTMLInputElement }) => void)
    | undefined
  /**
   * A keydown handler forwarded to the `input`.
   */
  onKeyDown?:
    | ((event: KeyboardEvent & { currentTarget: HTMLInputElement }) => void)
    | undefined
  /**
   * Optional tab index attribute forwarded to the `input`.
   */
  tabIndex?: number | undefined
}
function resolveThumbKeyValue(params: {
  event: KeyboardEvent
  thumbValue: number
  values: ReadonlyArray<number>
  index: number
  range: boolean
  rtl: boolean
  step: number
  largeStep: number
  min: number
  max: number
  minStepsBetweenValues: number
}): number | null {
  if (!ALL_KEYS.has(params.event.key)) {
    return null
  }

  let newValue: number | null = null
  let keyDirection = 0
  let increment = params.event.shiftKey ? params.largeStep : params.step
  const roundedValue = roundValueToStep(
    params.thumbValue,
    params.step,
    params.min
  )

  switch (params.event.key) {
    case ARROW_UP:
      keyDirection = 1
      break
    case ARROW_RIGHT:
      keyDirection = params.rtl ? -1 : 1
      break
    case ARROW_DOWN:
      keyDirection = -1
      break
    case ARROW_LEFT:
      keyDirection = params.rtl ? 1 : -1
      break
    case PAGE_UP:
      increment = params.largeStep
      keyDirection = 1
      break
    case PAGE_DOWN:
      increment = params.largeStep
      keyDirection = -1
      break
    case END:
      newValue =
        params.range && Number.isFinite(params.values[params.index + 1])
          ? params.values[params.index + 1]! -
            params.step * params.minStepsBetweenValues
          : params.max
      break
    case HOME:
      newValue =
        params.range && Number.isFinite(params.values[params.index - 1])
          ? params.values[params.index - 1]! +
            params.step * params.minStepsBetweenValues
          : params.min
      break
    default:
      break
  }

  if (keyDirection !== 0) {
    newValue = getNewValue(
      roundedValue,
      increment,
      keyDirection,
      params.min,
      params.max
    )
  }

  return newValue
}

function SliderThumbRangeInput(props: {
  assignRef: (element: HTMLInputElement | null) => void
  ariaLabel: () => string | undefined
  ariaLabelledBy: () => string | undefined
  ariaDescribedBy: () => string | undefined
  ariaInvalid: () => boolean | undefined
  orientation: () => 'horizontal' | 'vertical'
  thumbValue: () => number
  ariaValueText: () => string | undefined
  disabled: () => boolean
  form: () => string | undefined
  inputId: () => string | undefined
  max: () => number
  min: () => number
  name: () => string | undefined
  step: () => number
  tabIndex: () => number | undefined
  writingMode: () => JSX.CSSProperties['writing-mode'] | undefined
  onUserKeyDown: (
    event: KeyboardEvent & { currentTarget: HTMLInputElement }
  ) => void
  onUserFocus: (
    event: FocusEvent & { currentTarget: HTMLInputElement }
  ) => void
  onUserBlur: (
    event: FocusEvent & { currentTarget: HTMLInputElement }
  ) => void
  onValueInput: (
    valueInput: number,
    event: Event | KeyboardEvent
  ) => void
  onFocusThumb: () => void
  onBlurThumb: (relatedTarget: EventTarget | null) => 'skip-field' | 'commit-field'
  resolveKeyValue: (event: KeyboardEvent) => number | null
  syncValue: () => number
  restoringFocusVisibleRef: { current: boolean }
}): JSX.Element {
  return (
    <input
      ref={element => {
        props.assignRef(element)
        // Native listener: Solid JSX onKeyDown can miss keydown on nested range inputs in jsdom.
        const handleKeyDown = (event: KeyboardEvent) => {
          props.onUserKeyDown(
            event as KeyboardEvent & { currentTarget: HTMLInputElement }
          )

          if (event.defaultPrevented) {
            return
          }

          if (COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation()
          }

          const newValue = props.resolveKeyValue(event)
          if (newValue === null) {
            return
          }

          if (!matchesFocusVisible(element)) {
            props.restoringFocusVisibleRef.current = true
            element.blur()
            element.focus({
              preventScroll: true,
              focusVisible: true,
            } as FocusOptions)
          }

          props.onValueInput(newValue, event)
          element.value = String(props.syncValue())
          event.preventDefault()
        }
        element.addEventListener('keydown', handleKeyDown)
        onCleanup(() => {
          element.removeEventListener('keydown', handleKeyDown)
        })
      }}
      type="range"
      aria-label={props.ariaLabel()}
      aria-labelledby={props.ariaLabelledBy()}
      aria-describedby={props.ariaDescribedBy()}
      aria-orientation={props.orientation()}
      aria-valuenow={props.thumbValue()}
      aria-valuetext={props.ariaValueText()}
      aria-invalid={props.ariaInvalid()}
      disabled={props.disabled()}
      form={props.form()}
      id={props.inputId()}
      max={props.max()}
      min={props.min()}
      name={props.name()}
      step={props.step()}
      tabIndex={props.tabIndex()}
      value={props.thumbValue()}
      style={{
        ...visuallyHidden,
        width: '100%',
        height: '100%',
        'writing-mode': props.writingMode(),
      }}
      onChange={(event: Event & { currentTarget: HTMLInputElement }) => {
        props.onValueInput(event.currentTarget.valueAsNumber, event)
        event.currentTarget.value = String(props.syncValue())
      }}
      onFocus={(event: FocusEvent & { currentTarget: HTMLInputElement }) => {
        const isRestoringFocusVisible = props.restoringFocusVisibleRef.current
        props.restoringFocusVisibleRef.current = false
        props.onFocusThumb()

        if (isRestoringFocusVisible) {
          event.stopPropagation()
          return
        }

        props.onUserFocus(event)
      }}
      onBlur={(event: FocusEvent & { currentTarget: HTMLInputElement }) => {
        if (props.restoringFocusVisibleRef.current) {
          event.stopPropagation()
          return
        }

        const fieldAction = props.onBlurThumb(event.relatedTarget)
        if (fieldAction === 'skip-field') {
          props.onUserBlur(event)
          return
        }

        props.onUserBlur(event)
      }}
    />
  )
}
function getDefaultAriaValueText(
  values: ReadonlyArray<number>,
  index: number,
  format: Intl.NumberFormatOptions | undefined,
  locale: Intl.LocalesArgument | undefined
): string | undefined {
  if (index < 0) {
    return undefined
  }

  if (values.length === 2) {
    return `${formatNumber(values[index] ?? null, locale, format)} ${index === 0 ? 'start' : 'end'} range`
  }

  return format
    ? formatNumber(values[index] ?? null, locale, format)
    : undefined
}
function getNewValue(
  thumbValue: number,
  increment: number,
  direction: number,
  min: number,
  max: number
): number {
  const value = thumbValue + increment * direction
  const roundedValue = Number(
    value.toFixed(
      Math.max(
        getDecimalPrecision(thumbValue),
        getDecimalPrecision(increment),
        getDecimalPrecision(min)
      )
    )
  )
  return clamp(roundedValue, min, max)
}
function matchesFocusVisible(element: Element): boolean {
  try {
    return element.matches(':focus-visible')
  } catch {
    return false
  }
}
