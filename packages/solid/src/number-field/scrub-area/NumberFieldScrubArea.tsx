import {
  Timeout,
  addEventListener,
  getTarget,
  mergeCleanups,
  ownerDocument,
  ownerWindow,
  platform,
} from '@script-augur/base-ui-utils'
import {
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createGenericEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext'
import { getViewportRect } from '../utils/getViewportRect'
import { stateAttributesMapping } from '../utils/stateAttributesMapping'

import { NumberFieldScrubAreaContext } from './NumberFieldScrubAreaContext'

import type { NumberFieldScrubAreaContextValue } from './NumberFieldScrubAreaContext'
import type { RenderProp } from '../../internals/createRender'
import type { NumberFieldRootState } from '../root/NumberFieldRoot'
import type { JSX } from 'solid-js'

const SCRUB_AREA_STYLE: JSX.CSSProperties = {
  'touch-action': 'none',
  '-webkit-user-select': 'none',
  'user-select': 'none',
}

/**
 * An interactive area where the user can click and drag to change the field value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldScrubArea(
  componentProps: NumberFieldScrubAreaProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'direction',
    'pixelSensitivity',
    'teleportDistance',
    'ref',
    'children',
  ])

  const {
    state,
    isScrubbingAssign: rootIsScrubbingAssign,
    inputRef,
    incrementValue,
    allowInputSyncRef,
    getStepAmount,
    onValueCommitted,
    lastChangedValueRef,
    valueRef,
  } = useNumberFieldRootContext()

  const direction = () => local.direction ?? 'horizontal'
  const pixelSensitivity = () => local.pixelSensitivity ?? 2

  const scrubAreaRef: { current: HTMLSpanElement | null } = { current: null }
  const [scrubAreaElement, scrubAreaElementAssign] =
    createSignal<HTMLSpanElement | null>(null)
  const isScrubbingRef = { current: false }
  const didMoveRef = { current: false }
  const pointerDownTargetRef: { current: EventTarget | null } = {
    current: null,
  }
  const scrubAreaCursorRef: { current: HTMLSpanElement | null } = {
    current: null,
  }
  const virtualCursorCoords = { current: { x: 0, y: 0 } }

  const exitPointerLockTimeout = new Timeout()

  const [isTouchInput, isTouchInputAssign] = createSignal(false)
  const [isPointerLockDenied, isPointerLockDeniedAssign] = createSignal(false)
  const [isScrubbing, isScrubbingAssign] = createSignal(false)

  function updateCursorTransform(
    virtualCursor: HTMLSpanElement,
    x: number,
    y: number
  ) {
    const scale = ownerWindow(virtualCursor).visualViewport?.scale ?? 1
    virtualCursor.style.transform = `translate3d(${x}px,${y}px,0) scale(${1 / scale})`
  }

  function onScrub({ movementX, movementY }: PointerEvent) {
    const virtualCursor = scrubAreaCursorRef.current
    const scrubAreaEl = scrubAreaRef.current

    if (!virtualCursor || !scrubAreaEl) return

    const rect = getViewportRect(local.teleportDistance, scrubAreaEl)

    const coords = virtualCursorCoords.current

    function wrap(coord: number, halfSize: number, low: number, high: number) {
      if (coord + halfSize < low) return high - halfSize
      if (coord + halfSize > high) return low - halfSize
      return coord
    }

    const newCoords = {
      x: wrap(
        Math.round(coords.x + movementX),
        virtualCursor.offsetWidth / 2,
        rect.left,
        rect.right
      ),
      y: wrap(
        Math.round(coords.y + movementY),
        virtualCursor.offsetHeight / 2,
        rect.top,
        rect.bottom
      ),
    }

    virtualCursorCoords.current = newCoords

    updateCursorTransform(virtualCursor, newCoords.x, newCoords.y)
  }

  function onScrubbingChange(
    scrubbingValue: boolean,
    { clientX, clientY }: PointerEvent
  ) {
    isScrubbingAssign(scrubbingValue)
    rootIsScrubbingAssign(scrubbingValue)

    const virtualCursor = scrubAreaCursorRef.current
    if (!virtualCursor || !scrubbingValue) return

    const initialCoords = {
      x: clientX - virtualCursor.offsetWidth / 2,
      y: clientY - virtualCursor.offsetHeight / 2,
    }

    virtualCursorCoords.current = initialCoords

    updateCursorTransform(virtualCursor, initialCoords.x, initialCoords.y)
  }

  createEffect(function registerGlobalScrubbingEventListeners() {
    if (
      !inputRef.current ||
      state.disabled ||
      state.readOnly ||
      !isScrubbing()
    ) {
      return undefined
    }

    let cumulativeDelta = 0

    function handleScrubPointerUp(event: PointerEvent) {
      function handler() {
        try {
          ownerDocument(scrubAreaRef.current).exitPointerLock()
        } catch {
          // Ignore errors.
        } finally {
          isScrubbingRef.current = false
          onScrubbingChange(false, event)
          onValueCommitted(
            lastChangedValueRef.current ?? valueRef.current,
            createGenericEventDetails(REASONS.scrub, event)
          )

          const pointerDownTarget = pointerDownTargetRef.current
          const input = inputRef.current
          if (!didMoveRef.current && pointerDownTarget != null && input) {
            const win = ownerWindow(input) as Window & typeof globalThis
            pointerDownTarget.dispatchEvent(
              new win.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
              })
            )
          }

          didMoveRef.current = false
          pointerDownTargetRef.current = null
        }
      }

      if (platform.engine.gecko) {
        exitPointerLockTimeout.start(20, handler)
      } else {
        handler()
      }
    }

    function handleScrubPointerMove(event: PointerEvent) {
      if (!isScrubbingRef.current) return

      event.preventDefault()

      onScrub(event)

      const { movementX, movementY } = event

      cumulativeDelta += direction() === 'vertical' ? movementY : movementX

      if (Math.abs(cumulativeDelta) >= pixelSensitivity()) {
        cumulativeDelta = 0
        didMoveRef.current = true
        const dValue = direction() === 'vertical' ? -movementY : movementX
        const stepAmount = getStepAmount(event)
        const rawAmount = dValue * stepAmount

        if (rawAmount !== 0) {
          allowInputSyncRef.current = true
          incrementValue(Math.abs(rawAmount), {
            direction: rawAmount >= 0 ? 1 : -1,
            event,
            reason: REASONS.scrub,
          })
        }
      }
    }

    const win = ownerWindow(inputRef.current)
    const unsubscribe = mergeCleanups(
      addEventListener(win, 'pointerup', handleScrubPointerUp, true),
      addEventListener(win, 'pointermove', handleScrubPointerMove, true)
    )

    onCleanup(() => {
      exitPointerLockTimeout.clear()
      unsubscribe()
    })
  })

  createEffect(() => {
    onCleanup(() => {
      if (isScrubbingRef.current) {
        isScrubbingRef.current = false
        rootIsScrubbingAssign(false)
        try {
          ownerDocument(scrubAreaRef.current).exitPointerLock()
        } catch {
          // Ignore errors.
        }
      }
    })
  })

  createEffect(function registerScrubberTouchPreventListener() {
    const element = scrubAreaElement()
    if (!element || state.disabled || state.readOnly) {
      return undefined
    }

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length === 1) {
        event.preventDefault()
      }
    }

    const unsubscribe = addEventListener(
      element,
      'touchstart',
      handleTouchStart,
      {
        passive: false,
      }
    )
    onCleanup(unsubscribe)
  })

  function assignScrubAreaCursorRef(element: HTMLSpanElement | null) {
    scrubAreaCursorRef.current = element
  }

  const contextValue: NumberFieldScrubAreaContextValue = {
    isScrubbing,
    isTouchInput,
    isPointerLockDenied,
    scrubAreaCursorRef,
    assignScrubAreaCursorRef,
  }

  return (
    <NumberFieldScrubAreaContext.Provider value={contextValue}>
      {createRender<NumberFieldScrubAreaState, Record<string, unknown>>({
        defaultElement: 'span',
        state,
        render: local.render,
        stateAttributesMapping,
        ref: [
          local.ref,
          (el: Element | null | undefined) => {
            const node = (el as HTMLSpanElement | null) ?? null
            scrubAreaRef.current = node
            scrubAreaElementAssign(node)
          },
        ],
        props: mergeProps(
          {
            role: 'presentation',
            style: SCRUB_AREA_STYLE,
            async onPointerDown(event: PointerEvent) {
              if (
                event.defaultPrevented ||
                state.readOnly ||
                event.button ||
                state.disabled
              ) {
                return
              }

              const isTouch = event.pointerType === 'touch'
              isTouchInputAssign(isTouch)

              if (event.pointerType === 'mouse') {
                event.preventDefault()
                inputRef.current?.focus()
              }

              isScrubbingRef.current = true
              didMoveRef.current = false
              pointerDownTargetRef.current = getTarget(event)
              onScrubbingChange(true, event)

              if (!isTouch && !platform.engine.webkit) {
                try {
                  await ownerDocument(
                    scrubAreaRef.current
                  ).body.requestPointerLock()
                  isPointerLockDeniedAssign(false)
                } catch {
                  isPointerLockDeniedAssign(true)
                } finally {
                  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ref may clear mid-await
                  if (isScrubbingRef.current) {
                    onScrubbingChange(true, event)
                  }
                }
              }
            },
            get class() {
              return local.class
            },
            children: local.children,
          },
          elementProps as Record<string, unknown>
        ),
      })}
    </NumberFieldScrubAreaContext.Provider>
  )
}

export interface NumberFieldScrubAreaState extends NumberFieldRootState {}

export interface NumberFieldScrubAreaProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'children' | 'dir'
> {
  /**
   * Cursor movement direction in the scrub area.
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical' | undefined
  /**
   * Determines how many pixels the cursor must move before the value changes.
   * @default 2
   */
  pixelSensitivity?: number | undefined
  /**
   * If specified, determines the distance that the cursor may move from the center
   * of the scrub area before it will loop back around.
   */
  teleportDistance?: number | undefined
  render?: RenderProp<NumberFieldScrubAreaState, Record<string, unknown>>
  children?: JSX.Element
  ref?: ((element: Element) => void) | undefined
}
