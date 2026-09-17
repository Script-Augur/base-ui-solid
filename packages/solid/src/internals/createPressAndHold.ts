import {
  Interval,
  Timeout,
  addEventListener,
  ownerWindow,
} from '@script-augur/base-ui-utils'
import { createEffect, onCleanup } from 'solid-js'

import { NOOP } from './noop'

import type { Accessor, JSX } from 'solid-js'

const DEFAULT_TICK_DELAY = 60
const DEFAULT_START_DELAY = 400
const DEFAULT_SCROLL_DISTANCE = 8
const TOUCH_TIMEOUT = 50
const MAX_POINTER_MOVES_AFTER_TOUCH = 3
/**
 * Treat pen as touch-like to avoid forcing the software keyboard on stylus taps.
 * Linux Chrome may emit "pen" historically for mouse usage due to a bug, but the
 * touch path still works with minor behavioral differences.
 */
export function isTouchLikePointerType(pointerType: string): boolean {
  return pointerType === 'touch' || pointerType === 'pen'
}
/**
 * Adds press-and-hold behavior to a button element.
 * On pointer down, performs one action immediately, then after a delay starts
 * continuous repeated actions at a fixed interval. Handles mouse, touch, and pen
 * inputs correctly, including Android-specific quirks.
 *
 * Solid port of upstream `usePressAndHold`.
 */
export function createPressAndHold(
  params: CreatePressAndHoldParameters
): CreatePressAndHoldReturnValue {
  const tickDelay = params.tickDelay ?? DEFAULT_TICK_DELAY
  const startDelay = params.startDelay ?? DEFAULT_START_DELAY
  const scrollDistance = params.scrollDistance ?? DEFAULT_SCROLL_DISTANCE

  const startTickTimeout = new Timeout()
  const tickInterval = new Interval()
  const intentionalTouchCheckTimeout = new Timeout()

  const isPressedRef = { current: false }
  const movesAfterTouchRef = { current: 0 }
  const downCoordsRef = { current: { x: 0, y: 0 } }
  const isTouchingButtonRef = { current: false }
  const ignoreClickRef = { current: false }
  const pointerTypeRef = { current: '' }
  const unsubscribeFromGlobalContextMenuRef = { current: NOOP }
  const unsubscribeFromGlobalPointerUpRef = { current: NOOP }

  function stopAutoChange() {
    intentionalTouchCheckTimeout.clear()
    startTickTimeout.clear()
    tickInterval.clear()
    unsubscribeFromGlobalContextMenuRef.current()
    movesAfterTouchRef.current = 0
  }

  function startAutoChange(triggerNativeEvent?: Event) {
    stopAutoChange()

    const element = params.elementRef.current
    if (!element) return

    const win = ownerWindow(element)

    function handleContextMenu(event: Event) {
      event.preventDefault()
    }

    unsubscribeFromGlobalContextMenuRef.current = addEventListener(
      win,
      'contextmenu',
      handleContextMenu
    )

    function handlePointerRelease(event: PointerEvent) {
      isPressedRef.current = false
      // Drop both once-listeners immediately so a paired cancel/up can't
      // double-fire `onStop`.
      unsubscribeFromGlobalPointerUpRef.current()
      unsubscribeFromGlobalPointerUpRef.current = NOOP
      stopAutoChange()
      params.onStop?.(event)
    }

    // Replace any existing release listeners first so mouseleave/mouseenter
    // during a hold doesn't stack them (which would fire `onStop` more than
    // once). Also listen for `pointercancel` — removing/remounting the button
    // mid-press can cancel the pointer without a `pointerup`.
    unsubscribeFromGlobalPointerUpRef.current()
    const unsubscribePointerUp = addEventListener(
      win,
      'pointerup',
      handlePointerRelease,
      { once: true }
    )
    const unsubscribePointerCancel = addEventListener(
      win,
      'pointercancel',
      handlePointerRelease,
      { once: true }
    )
    unsubscribeFromGlobalPointerUpRef.current = () => {
      unsubscribePointerUp()
      unsubscribePointerCancel()
    }

    if (!params.tick(triggerNativeEvent)) {
      stopAutoChange()
      return
    }

    startTickTimeout.start(startDelay, () => {
      tickInterval.start(tickDelay, () => {
        if (!params.tick(triggerNativeEvent)) {
          stopAutoChange()
        }
      })
    })
  }

  createEffect(() => {
    if (!params.disabled()) return
    isPressedRef.current = false
    isTouchingButtonRef.current = false
    pointerTypeRef.current = ''
    stopAutoChange()
  })

  onCleanup(() => {
    stopAutoChange()
    unsubscribeFromGlobalPointerUpRef.current()
  })

  const pointerHandlers: CreatePressAndHoldReturnValue['pointerHandlers'] = {
    onTouchStart() {
      isTouchingButtonRef.current = true
    },
    onTouchEnd() {
      isTouchingButtonRef.current = false
    },
    onPointerDown(event) {
      if (event.defaultPrevented || event.button || params.disabled()) {
        return
      }

      pointerTypeRef.current = event.pointerType
      ignoreClickRef.current = false
      isPressedRef.current = true
      downCoordsRef.current = { x: event.clientX, y: event.clientY }

      const isTouchPointer = isTouchLikePointerType(event.pointerType)

      if (!isTouchPointer) {
        event.preventDefault()
        startAutoChange(event)
      } else {
        intentionalTouchCheckTimeout.start(TOUCH_TIMEOUT, () => {
          const moves = movesAfterTouchRef.current
          movesAfterTouchRef.current = 0
          const stillPressed = isPressedRef.current
          if (stillPressed && moves < MAX_POINTER_MOVES_AFTER_TOUCH) {
            startAutoChange(event)
            ignoreClickRef.current = true
          } else {
            ignoreClickRef.current = false
            stopAutoChange()
          }
        })
      }
    },
    onPointerUp(event) {
      if (isTouchLikePointerType(event.pointerType)) {
        isPressedRef.current = false
      }
    },
    onPointerMove(event) {
      if (
        params.disabled() ||
        !isTouchLikePointerType(event.pointerType) ||
        !isPressedRef.current
      ) {
        return
      }

      movesAfterTouchRef.current += 1

      const { x, y } = downCoordsRef.current
      const dx = x - event.clientX
      const dy = y - event.clientY

      if (dx ** 2 + dy ** 2 > scrollDistance ** 2) {
        stopAutoChange()
      }
    },
    onMouseEnter(event) {
      if (
        event.defaultPrevented ||
        params.disabled() ||
        !isPressedRef.current ||
        isTouchingButtonRef.current ||
        isTouchLikePointerType(pointerTypeRef.current)
      ) {
        return
      }

      startAutoChange(event)
    },
    onMouseLeave() {
      if (isTouchingButtonRef.current) return

      stopAutoChange()
    },
    onMouseUp() {
      if (isTouchingButtonRef.current) return

      stopAutoChange()
    },
  }

  function shouldSkipClick(event: MouseEvent): boolean {
    if (event.defaultPrevented) {
      return true
    }
    if (isTouchLikePointerType(pointerTypeRef.current)) {
      return ignoreClickRef.current
    }
    return event.detail !== 0
  }

  return { pointerHandlers, shouldSkipClick }
}
export interface CreatePressAndHoldParameters {
  disabled: Accessor<boolean>
  /**
   * Called on each tick during a hold. Return `false` to stop the auto-change sequence.
   */
  tick: (triggerEvent?: Event) => boolean
  /**
   * Called when the hold ends via the global `pointerup` event.
   */
  onStop?: ((nativeEvent: PointerEvent) => void) | undefined
  /**
   * Interval between ticks once the hold is active.
   * @default 60
   */
  tickDelay?: number | undefined
  /**
   * Delay before the repeating ticks start after the initial hold.
   * @default 400
   */
  startDelay?: number | undefined
  /**
   * Pointer movement distance (px) that cancels the hold and is treated as scrolling.
   * @default 8
   */
  scrollDistance?: number | undefined
  /**
   * Ref to the anchor element used to resolve `ownerWindow`.
   */
  elementRef: { current: HTMLElement | null }
}
export interface CreatePressAndHoldReturnValue {
  pointerHandlers: {
    onTouchStart: JSX.EventHandlerUnion<HTMLElement, TouchEvent>
    onTouchEnd: JSX.EventHandlerUnion<HTMLElement, TouchEvent>
    onPointerDown: JSX.EventHandlerUnion<HTMLElement, PointerEvent>
    onPointerUp: JSX.EventHandlerUnion<HTMLElement, PointerEvent>
    onPointerMove: JSX.EventHandlerUnion<HTMLElement, PointerEvent>
    onMouseEnter: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
    onMouseLeave: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
    onMouseUp: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
  }
  /**
   * Returns `true` if the `onClick` handler should be skipped.
   * Use this in the element's `onClick` to prevent double-firing on mouse clicks
   * (already handled by `onPointerDown`) and to suppress the synthesized click
   * that browsers fire after a touch hold.
   */
  shouldSkipClick: (event: MouseEvent) => boolean
}
