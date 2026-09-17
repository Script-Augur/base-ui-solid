import {
  AnimationFrame,
  activeElement,
  addEventListener,
  clamp,
  contains,
  getTarget,
  ownerDocument,
  ownerWindow,
} from '@script-augur/base-ui-utils'
import { children, createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useDirection } from '../../internals/direction'
import { useSliderRootContext } from '../root/SliderRootContext'
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping'
import { getMidpoint } from '../utils/getMidpoint'
import { resolveThumbCollision } from '../utils/resolveThumbCollision'
import { roundValueToStep } from '../utils/roundValueToStep'
import { validateMinimumDistance } from '../utils/validateMinimumDistance'

import type { RenderProp } from '../../internals/createRender'
import type { SliderRootState } from '../root/SliderRoot'
import type { JSX } from 'solid-js'

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2
/**
 * The clickable, interactive part of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderControl(
  componentProps: SliderControlProps
): JSX.Element {
  const {
    disabled,
    dragging,
    inset,
    lastChangeReasonRef,
    max,
    min,
    minStepsBetweenValues,
    onValueCommitted,
    orientation,
    pressedThumbCenterOffsetRef,
    pressedThumbIndexRef,
    pressedValuesRef,
    registerFieldControlRef,
    renderBeforeHydration,
    activeAssign,
    draggingAssign,
    setValue,
    state,
    step,
    thumbCollisionBehavior,
    thumbRefs,
    values,
  } = useSliderRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
    'children',
  ])

  const direction = useDirection()
  const range = () => values().length > 1
  const vertical = () => orientation() === 'vertical'

  const controlRef: { current: HTMLElement | null } = { current: null }
  const stylesRef: { current: CSSStyleDeclaration | null } = { current: null }
  const touchIdRef: { current: number | null } = { current: null }
  const moveCountRef: { current: number } = { current: 0 }
  const insetThumbOffsetRef: { current: number } = { current: 0 }
  const currentInteractionValueRef: {
    current: number | Array<number> | null
  } = { current: null }
  const latestValuesRef: { current: ReadonlyArray<number> } = {
    current: values(),
  }

  createEffect(() => {
    latestValuesRef.current = values()
  })

  function setStylesRef(element: HTMLElement | null) {
    if (element && stylesRef.current == null) {
      stylesRef.current = ownerWindow(element).getComputedStyle(element)
    }
  }

  function getThumbInput(el: Element | null | undefined) {
    return el?.querySelector<HTMLInputElement>('input[type="range"]')
  }

  function updatePressedThumb(nextIndex: number) {
    pressedThumbIndexRef.current = nextIndex
    if (!thumbRefs.current[nextIndex]) {
      pressedThumbCenterOffsetRef.current = null
    }
  }

  function resetPressedThumb() {
    pressedThumbIndexRef.current = -1
    pressedThumbCenterOffsetRef.current = null
  }

  function isTargetDisabledThumb(target: EventTarget | null) {
    if (!(target instanceof Element)) {
      return false
    }

    return thumbRefs.current.some(thumbEl => {
      if (!(thumbEl instanceof Element) || !contains(thumbEl, target)) {
        return false
      }

      return getThumbInput(thumbEl)?.disabled === true
    })
  }

  function getFingerState(fingerCoords: Coords): FingerState | null {
    const control = controlRef.current
    const thumbIndex = pressedThumbIndexRef.current
    const currentValues = values()

    if (!control || thumbIndex < 0 || thumbIndex >= currentValues.length) {
      if (thumbIndex >= currentValues.length) {
        currentInteractionValueRef.current = null
      }
      return null
    }

    const { width, height, bottom, left, right } =
      control.getBoundingClientRect()

    const isVertical = vertical()
    const controlOffset = getControlOffset(stylesRef.current, isVertical)
    const insetThumbOffset = insetThumbOffsetRef.current
    const controlSize =
      (isVertical ? height : width) -
      controlOffset.start -
      controlOffset.end -
      insetThumbOffset * 2
    const thumbCenterOffset = pressedThumbCenterOffsetRef.current ?? 0
    const fingerX = fingerCoords.x - thumbCenterOffset
    const fingerY = fingerCoords.y - thumbCenterOffset

    const valueSize = isVertical
      ? bottom - fingerY - controlOffset.end
      : (direction() === 'rtl' ? right - fingerX : fingerX - left) -
        controlOffset.start
    const valueRescaled = clamp(
      (valueSize - insetThumbOffset) / controlSize,
      0,
      1
    )

    let newValue = (max() - min()) * valueRescaled + min()
    newValue = roundValueToStep(newValue, step(), min())
    newValue = clamp(newValue, min(), max())

    if (!range()) {
      return {
        value: newValue,
        thumbIndex,
        didSwap: false,
      }
    }

    return resolveThumbCollision(
      thumbCollisionBehavior(),
      currentValues,
      latestValuesRef.current,
      pressedValuesRef.current,
      thumbIndex,
      newValue,
      min(),
      max(),
      step(),
      minStepsBetweenValues()
    )
  }

  function startPressing(fingerCoords: Coords) {
    const currentValues = values()
    pressedValuesRef.current = range() ? currentValues.slice() : null
    currentInteractionValueRef.current = null
    latestValuesRef.current = currentValues

    const pressedThumbIndex = pressedThumbIndexRef.current
    let closestThumbIndex = pressedThumbIndex

    if (pressedThumbIndex > -1 && pressedThumbIndex < currentValues.length) {
      if (currentValues[pressedThumbIndex] === max()) {
        let candidateIndex = pressedThumbIndex

        while (
          candidateIndex > 0 &&
          currentValues[candidateIndex - 1] === max()
        ) {
          candidateIndex -= 1
        }

        closestThumbIndex = candidateIndex
      }
    } else {
      const axis = !vertical() ? 'x' : 'y'
      let minDistance: number | undefined

      closestThumbIndex = -1

      for (let i = 0; i < thumbRefs.current.length; i += 1) {
        const thumbEl = thumbRefs.current[i]
        if (thumbEl instanceof Element && !getThumbInput(thumbEl)?.disabled) {
          const midpoint = getMidpoint(thumbEl, vertical())
          const distance = Math.abs(fingerCoords[axis] - midpoint)

          if (minDistance === undefined || distance <= minDistance) {
            closestThumbIndex = i
            minDistance = distance
          }
        }
      }
    }

    if (closestThumbIndex > -1 && closestThumbIndex !== pressedThumbIndex) {
      updatePressedThumb(closestThumbIndex)
    }

    if (inset()) {
      const thumbEl = thumbRefs.current[closestThumbIndex]
      if (thumbEl instanceof Element) {
        const thumbRect = thumbEl.getBoundingClientRect()
        const side = !vertical() ? 'width' : 'height'
        insetThumbOffsetRef.current = thumbRect[side] / 2
      }
    }
  }

  function focusThumb(thumbIndex: number) {
    const input = getThumbInput(thumbRefs.current[thumbIndex])
    if (!input) {
      return
    }

    input.focus({
      preventScroll: true,
      focusVisible: false,
    } as FocusOptions)
  }

  function setValueFromPointer(
    finger: FingerState,
    reason: typeof REASONS.trackPress | typeof REASONS.drag,
    nativeEvent: TouchEvent | PointerEvent
  ) {
    const applied = setValue(
      finger.value,
      createChangeEventDetails(reason, nativeEvent, undefined, {
        activeThumbIndex: finger.thumbIndex,
      })
    )

    if (applied) {
      currentInteractionValueRef.current = finger.value
      latestValuesRef.current = Array.isArray(finger.value)
        ? finger.value
        : [finger.value]

      if (finger.didSwap) {
        updatePressedThumb(finger.thumbIndex)
        focusThumb(finger.thumbIndex)
      }
    }

    return applied
  }

  function handleTouchMove(nativeEvent: TouchEvent | PointerEvent) {
    const fingerCoords = getFingerCoords(nativeEvent, touchIdRef)

    if (fingerCoords == null) {
      return
    }

    moveCountRef.current += 1

    if (
      nativeEvent.type === 'pointermove' &&
      (nativeEvent as PointerEvent).buttons === 0
    ) {
      handleTouchEnd(nativeEvent)
      return
    }

    const finger = getFingerState(fingerCoords)

    if (finger == null) {
      return
    }

    if (
      validateMinimumDistance(finger.value, step(), minStepsBetweenValues())
    ) {
      if (
        !dragging() &&
        moveCountRef.current > INTENTIONAL_DRAG_COUNT_THRESHOLD
      ) {
        draggingAssign(true)
      }

      setValueFromPointer(finger, REASONS.drag, nativeEvent)
    }
  }

  function handleTouchEnd(nativeEvent: TouchEvent | PointerEvent) {
    activeAssign(-1)
    draggingAssign(false)

    pressedThumbCenterOffsetRef.current = null

    const interactionValue = currentInteractionValueRef.current
    if (
      Array.isArray(interactionValue) &&
      interactionValue.length !== values().length
    ) {
      currentInteractionValueRef.current = null
    }

    if (currentInteractionValueRef.current != null) {
      const commitReason = lastChangeReasonRef.current
      onValueCommitted(
        currentInteractionValueRef.current,
        createGenericEventDetails(commitReason, nativeEvent)
      )
    }

    if (
      'pointerType' in nativeEvent &&
      controlRef.current &&
      controlRef.current.hasPointerCapture(nativeEvent.pointerId)
    ) {
      controlRef.current.releasePointerCapture(nativeEvent.pointerId)
    }

    pressedThumbIndexRef.current = -1
    touchIdRef.current = null
    stopListening()
  }

  function handleTouchStart(nativeEvent: TouchEvent) {
    if (disabled()) {
      return
    }

    if (isTargetDisabledThumb(getTarget(nativeEvent))) {
      resetPressedThumb()
      return
    }

    const touch = nativeEvent.changedTouches[0]
    if (touch == null) {
      return
    }

    touchIdRef.current = touch.identifier

    const fingerCoords = { x: touch.clientX, y: touch.clientY }
    startPressing(fingerCoords)

    const finger = getFingerState(fingerCoords)

    if (finger == null) {
      return
    }

    focusThumb(finger.thumbIndex)
    setValueFromPointer(finger, REASONS.trackPress, nativeEvent)

    moveCountRef.current = 0
    const doc = ownerDocument(controlRef.current)
    doc.addEventListener('touchmove', handleTouchMove, { passive: true })
    doc.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  function stopListening() {
    const doc = ownerDocument(controlRef.current)
    doc.removeEventListener('pointermove', handleTouchMove)
    doc.removeEventListener('pointerup', handleTouchEnd)
    doc.removeEventListener('touchmove', handleTouchMove)
    doc.removeEventListener('touchend', handleTouchEnd)
    pressedValuesRef.current = null
    currentInteractionValueRef.current = null
  }

  const focusFrame = new AnimationFrame()

  createEffect(() => {
    const control = controlRef.current
    if (!control) {
      onCleanup(() => stopListening())
      return
    }

    const unsubscribeTouchStart = addEventListener(
      control,
      'touchstart',
      handleTouchStart,
      { passive: true }
    )

    onCleanup(() => {
      unsubscribeTouchStart()
      focusFrame.cancel()
      stopListening()
    })
  })

  createEffect(() => {
    if (disabled()) {
      stopListening()
    }
  })

  void renderBeforeHydration
  void dragging

  const resolvedChildren = children(() => local.children)

  return createRender<SliderControlState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    stateAttributesMapping: sliderStateAttributesMapping,
    ref: [
      element => {
        controlRef.current = element as HTMLElement | null
        registerFieldControlRef(element)
        setStylesRef(element as HTMLElement | null)
      },
      local.ref as never,
    ],
    props: mergeProps(elementProps as Record<string, unknown>, {
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get children() {
        return resolvedChildren()
      },
      onPointerDown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
        const control = controlRef.current
        const target = getTarget(event)

        if (
          !control ||
          disabled() ||
          event.defaultPrevented ||
          !(target instanceof Element) ||
          event.button !== 0
        ) {
          return
        }

        if (isTargetDisabledThumb(target)) {
          resetPressedThumb()
          return
        }

        const fingerCoords = { x: event.clientX, y: event.clientY }
        startPressing(fingerCoords)

        const finger = getFingerState(fingerCoords)

        if (finger == null) {
          return
        }

        const pressedOnFocusedThumb = contains(
          thumbRefs.current[finger.thumbIndex],
          activeElement(ownerDocument(control))
        )

        if (pressedOnFocusedThumb) {
          event.preventDefault()
        } else {
          focusFrame.request(() => {
            focusThumb(finger.thumbIndex)
          })
        }

        draggingAssign(true)

        const pressedOnAnyThumb = pressedThumbCenterOffsetRef.current != null
        if (!pressedOnAnyThumb) {
          setValueFromPointer(finger, REASONS.trackPress, event)
        }

        control.setPointerCapture(event.pointerId)

        moveCountRef.current = 0
        const doc = ownerDocument(control)
        doc.addEventListener('pointermove', handleTouchMove, {
          passive: true,
        })
        doc.addEventListener('pointerup', handleTouchEnd, { once: true })
      },
    }),
  })
}
/** Public state exposed to `render` functions. */
export interface SliderControlState extends SliderRootState {}
/** Props for {@link SliderControl}. */
export type SliderControlProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'color'
> & {
  render?: RenderProp<SliderControlState, Record<string, unknown>>
}
function getControlOffset(
  styles: CSSStyleDeclaration | null,
  vertical: boolean
) {
  if (!styles) {
    return {
      start: 0,
      end: 0,
    }
  }

  function parseSize(value: string | null | undefined) {
    const parsed = value != null ? parseFloat(value) : 0
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const start = !vertical ? 'InlineStart' : 'Top'
  const end = !vertical ? 'InlineEnd' : 'Bottom'

  return {
    start:
      parseSize(styles[`border${start}Width` as keyof CSSStyleDeclaration] as string) +
      parseSize(styles[`padding${start}` as keyof CSSStyleDeclaration] as string),
    end:
      parseSize(styles[`border${end}Width` as keyof CSSStyleDeclaration] as string) +
      parseSize(styles[`padding${end}` as keyof CSSStyleDeclaration] as string),
  }
}
function getFingerCoords(
  event: TouchEvent | PointerEvent,
  touchIdRef: { current: number | null }
): Coords | null {
  if (touchIdRef.current != null && 'changedTouches' in event) {
    const touchEvent = event
    for (const touch of touchEvent.changedTouches) {
      if (touch.identifier === touchIdRef.current) {
        return {
          x: touch.clientX,
          y: touch.clientY,
        }
      }
    }

    return null
  }

  return {
    x: (event as PointerEvent).clientX,
    y: (event as PointerEvent).clientY,
  }
}
interface Coords {
  x: number
  y: number
}
interface FingerState {
  value: number | Array<number>
  thumbIndex: number
  didSwap: boolean
}
