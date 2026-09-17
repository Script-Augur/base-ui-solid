import {
  activeElement,
  addEventListener,
  contains,
  getTarget,
  inertValue,
  ownerDocument,
} from '@script-augur/base-ui-utils'
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createRender } from '../../internals/createRender'
import { transitionStatusMapping } from '../../internals/stateAttributesMapping'
import { useToastProviderContext } from '../provider/ToastProviderContext'
import {
  BASE_UI_SWIPE_IGNORE_SELECTOR,
  LEGACY_SWIPE_IGNORE_SELECTOR,
  getDisplacement,
  getElementTransform,
} from '../utils/swipe'

import { ToastRootContext } from './ToastRootContext'
import { ToastRootCssVars } from './ToastRootCssVars'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { ToastObject } from '../useToastManager'
import type { JSX } from 'solid-js'

const SWIPE_THRESHOLD = 40
const REVERSE_CANCEL_THRESHOLD = 10
const OPPOSITE_DIRECTION_DAMPING_FACTOR = 0.5
const MIN_DRAG_THRESHOLD = 1
const TOAST_SWIPE_IGNORE_SELECTOR = `${BASE_UI_SWIPE_IGNORE_SELECTOR},${LEGACY_SWIPE_IGNORE_SELECTOR}`
export const toastRootStateAttributesMapping = {
  ...transitionStatusMapping,
  swipeDirection(value: ToastRootState['swipeDirection']) {
    return value ? { 'data-swipe-direction': String(value) } : null
  },
} as StateAttributesMapping<ToastRootState>
/**
 * Groups all parts of an individual toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Root props including `toast`.
 * @returns A Solid JSX element.
 */
export function ToastRoot(componentProps: ToastRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'toast',
    'render',
    'class',
    'style',
    'swipeDirection',
    'children',
    'ref',
  ])

  const store = useToastProviderContext()

  const isAnchored = () => local.toast.positionerProps?.anchor !== undefined

  const swipeDirections = (): Array<'up' | 'down' | 'left' | 'right'> => {
    if (isAnchored()) return []
    const dir = local.swipeDirection ?? ['down', 'right']
    return Array.isArray(dir) ? dir : [dir]
  }

  const swipeEnabled = () => swipeDirections().length > 0

  const [currentSwipeDirection, currentSwipeDirectionAssign] = createSignal<
    'up' | 'down' | 'left' | 'right' | undefined
  >(undefined)
  const [isSwiping, isSwipingAssign] = createSignal(false)
  const [isRealSwipe, isRealSwipeAssign] = createSignal(false)
  const [dragOffset, dragOffsetAssign] = createSignal({ x: 0, y: 0 })
  const [initialTransform, initialTransformAssign] = createSignal({
    x: 0,
    y: 0,
    scale: 1,
  })
  const [titleId, titleIdAssign] = createSignal<string | undefined>()
  const [descriptionId, descriptionIdAssign] = createSignal<
    string | undefined
  >()
  const [lockedDirection, lockedDirectionAssign] = createSignal<
    'horizontal' | 'vertical' | null
  >(null)

  const [rootEl, rootElAssign] = createSignal<HTMLDivElement | null>(null)
  let lastToastId: string | undefined
  let dragStartPos = { x: 0, y: 0 }
  let initialTransformRef = { x: 0, y: 0, scale: 1 }
  let intendedSwipeDirection: 'up' | 'down' | 'left' | 'right' | undefined
  let maxSwipeDisplacement = 0
  let cancelledSwipe = false
  let swipeCancelBaseline = { x: 0, y: 0 }
  let isFirstPointerMove = false
  let dragOffsetRef = { x: 0, y: 0 }
  let activePointerId: number | null = null
  let dragAbortController: AbortController | null = null

  const expanded = store.select('expanded')
  const focused = store.select('focused')

  const toastId = createMemo(() => local.toast.id)
  const isStarting = createMemo(
    () => local.toast.transitionStatus === 'starting'
  )
  const isOpen = createMemo(() => local.toast.transitionStatus !== 'ending')
  const toastHeight = createMemo(() => local.toast.height)
  const toastLimited = createMemo(() => Boolean(local.toast.limited))
  const toastType = createMemo(() => local.toast.type)
  const toastPriority = createMemo(() => local.toast.priority)
  const toastTransitionStatus = createMemo(() => local.toast.transitionStatus)

  const domIndexOf = createMemo(() => store.select('toastIndex', toastId())())
  const visibleIndexOf = createMemo(() =>
    store.select('toastVisibleIndex', toastId())()
  )
  const offsetYOf = createMemo(() => store.select('toastOffsetY', toastId())())

  createOpenChangeComplete({
    open: isOpen,
    element: rootEl,
    onComplete() {
      if (!isOpen()) {
        store.removeToast(toastId())
      }
    },
  })

  function recalculateHeight(_flushSync: boolean = false) {
    const element = rootEl()
    if (!element) {
      return
    }

    const previousHeight = element.style.height
    element.style.height = 'auto'
    const height = element.offsetHeight
    element.style.height = previousHeight

    const existing = store.state.toastMetadata.get(toastId())?.value
    if (
      existing &&
      existing.height === height &&
      existing.ref === element &&
      existing.transitionStatus !== 'starting'
    ) {
      return
    }

    store.updateToastInternal(toastId(), {
      ref: element,
      height,
      transitionStatus: undefined,
    })
  }

  createEffect(() => {
    const id = toastId()
    const starting = isStarting()
    const previousToastId = lastToastId
    if (!starting && previousToastId === id) {
      return
    }

    if (previousToastId !== undefined) {
      currentSwipeDirectionAssign(undefined)
      initialTransformAssign({ x: 0, y: 0, scale: 1 })
      setResolvedDragOffset({ x: 0, y: 0 })
    }

    lastToastId = id
    untrack(() => recalculateHeight())
  })

  onCleanup(() => {
    dragAbortController?.abort()
  })

  function setResolvedDragOffset(next: { x: number; y: number }) {
    dragOffsetRef = next
    dragOffsetAssign(next)
  }

  function applyDirectionalDamping(deltaX: number, deltaY: number) {
    const dirs = swipeDirections()
    const damp = (delta: number) =>
      delta > 0
        ? delta ** OPPOSITE_DIRECTION_DAMPING_FACTOR
        : -(Math.abs(delta) ** OPPOSITE_DIRECTION_DAMPING_FACTOR)

    const dampX =
      (deltaX > 0 && !dirs.includes('right')) ||
      (deltaX < 0 && !dirs.includes('left'))
    const dampY =
      (deltaY > 0 && !dirs.includes('down')) ||
      (deltaY < 0 && !dirs.includes('up'))

    return {
      x: dampX ? damp(deltaX) : deltaX,
      y: dampY ? damp(deltaY) : deltaY,
    }
  }

  function handleSwipeEnd(event: PointerEvent) {
    if (event.pointerId !== activePointerId) {
      return
    }

    activePointerId = null
    dragAbortController?.abort()
    dragAbortController = null
    isSwipingAssign(false)
    isRealSwipeAssign(false)
    lockedDirectionAssign(null)

    const resolvedInitialTransform = initialTransformRef

    if (event.type === 'pointercancel' || cancelledSwipe) {
      setResolvedDragOffset({
        x: resolvedInitialTransform.x,
        y: resolvedInitialTransform.y,
      })
      currentSwipeDirectionAssign(undefined)
      return
    }

    const resolvedDragOffset = dragOffsetRef
    const deltaX = resolvedDragOffset.x - resolvedInitialTransform.x
    const deltaY = resolvedDragOffset.y - resolvedInitialTransform.y
    let dismissDirection: 'up' | 'down' | 'left' | 'right' | undefined

    for (const direction of swipeDirections()) {
      if (getDisplacement(direction, deltaX, deltaY) > SWIPE_THRESHOLD) {
        dismissDirection = direction
        break
      }
    }

    if (dismissDirection) {
      currentSwipeDirectionAssign(dismissDirection)
      store.closeToast(local.toast.id)
    } else {
      setResolvedDragOffset({
        x: resolvedInitialTransform.x,
        y: resolvedInitialTransform.y,
      })
      currentSwipeDirectionAssign(undefined)
    }
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0) {
      return
    }

    if (event.pointerType === 'touch') {
      store.pauseTimers()
    }

    const target = getTarget(event) as HTMLElement | null
    const isInteractiveElement = target?.closest(
      `button,a,input,textarea,[role="button"],${TOAST_SWIPE_IGNORE_SELECTOR}`
    )

    if (isInteractiveElement) {
      return
    }

    cancelledSwipe = false
    intendedSwipeDirection = undefined
    maxSwipeDisplacement = 0
    activePointerId = event.pointerId
    dragStartPos = { x: event.clientX, y: event.clientY }
    swipeCancelBaseline = dragStartPos

    const element = event.currentTarget as HTMLElement
    const transform = getElementTransform(element)
    initialTransformRef = transform
    initialTransformAssign(transform)
    setResolvedDragOffset({ x: transform.x, y: transform.y })

    store.set('hovering', true)
    isSwipingAssign(true)
    isRealSwipeAssign(false)
    lockedDirectionAssign(null)
    isFirstPointerMove = true

    dragAbortController?.abort()
    const controller = new AbortController()
    dragAbortController = controller

    const doc = ownerDocument(element)
    doc.addEventListener('pointerup', handleSwipeEnd, {
      signal: controller.signal,
    })
    doc.addEventListener('pointercancel', handleSwipeEnd, {
      signal: controller.signal,
    })

    element.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerId !== activePointerId) {
      return
    }

    event.preventDefault()

    if (isFirstPointerMove) {
      dragStartPos = { x: event.clientX, y: event.clientY }
      isFirstPointerMove = false
    }

    const { clientY, clientX, movementX, movementY } = event

    if (
      (movementY < 0 && clientY > swipeCancelBaseline.y) ||
      (movementY > 0 && clientY < swipeCancelBaseline.y)
    ) {
      swipeCancelBaseline = { x: swipeCancelBaseline.x, y: clientY }
    }

    if (
      (movementX < 0 && clientX > swipeCancelBaseline.x) ||
      (movementX > 0 && clientX < swipeCancelBaseline.x)
    ) {
      swipeCancelBaseline = { x: clientX, y: swipeCancelBaseline.y }
    }

    const deltaX = clientX - dragStartPos.x
    const deltaY = clientY - dragStartPos.y
    const cancelDeltaY = clientY - swipeCancelBaseline.y
    const cancelDeltaX = clientX - swipeCancelBaseline.x

    let resolvedLockedDirection = lockedDirection()
    const dirs = swipeDirections()

    if (!isRealSwipe()) {
      const movementDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      if (movementDistance >= MIN_DRAG_THRESHOLD) {
        isRealSwipeAssign(true)
        const hasHorizontal = dirs.includes('left') || dirs.includes('right')
        const hasVertical = dirs.includes('up') || dirs.includes('down')
        if (hasHorizontal && hasVertical) {
          const absX = Math.abs(deltaX)
          const absY = Math.abs(deltaY)
          resolvedLockedDirection = absX > absY ? 'horizontal' : 'vertical'
          lockedDirectionAssign(resolvedLockedDirection)
        }
      }
    }

    let candidate: 'up' | 'down' | 'left' | 'right' | undefined
    if (!intendedSwipeDirection) {
      if (resolvedLockedDirection === 'vertical') {
        if (deltaY > 0) candidate = 'down'
        else if (deltaY < 0) candidate = 'up'
      } else if (resolvedLockedDirection === 'horizontal') {
        if (deltaX > 0) candidate = 'right'
        else if (deltaX < 0) candidate = 'left'
      } else if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        candidate = deltaX > 0 ? 'right' : 'left'
      } else {
        candidate = deltaY > 0 ? 'down' : 'up'
      }

      if (candidate && dirs.includes(candidate)) {
        intendedSwipeDirection = candidate
        maxSwipeDisplacement = getDisplacement(candidate, deltaX, deltaY)
        currentSwipeDirectionAssign(candidate)
      }
    } else {
      const direction = intendedSwipeDirection
      const currentDisplacement = getDisplacement(
        direction,
        cancelDeltaX,
        cancelDeltaY
      )

      if (currentDisplacement > SWIPE_THRESHOLD) {
        cancelledSwipe = false
        currentSwipeDirectionAssign(direction)
      } else if (
        !(dirs.includes('left') && dirs.includes('right')) &&
        !(dirs.includes('up') && dirs.includes('down')) &&
        maxSwipeDisplacement - currentDisplacement >= REVERSE_CANCEL_THRESHOLD
      ) {
        cancelledSwipe = true
      }
    }

    const dampedDelta = applyDirectionalDamping(deltaX, deltaY)
    let newOffsetX = initialTransformRef.x
    let newOffsetY = initialTransformRef.y

    const hasHorizontalDir = dirs.includes('left') || dirs.includes('right')
    const hasVerticalDir = dirs.includes('up') || dirs.includes('down')

    if (resolvedLockedDirection !== 'vertical' && hasHorizontalDir) {
      newOffsetX += dampedDelta.x
    }

    if (resolvedLockedDirection !== 'horizontal' && hasVerticalDir) {
      newOffsetY += dampedDelta.y
    }

    setResolvedDragOffset({ x: newOffsetX, y: newOffsetY })
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (
        !rootEl() ||
        !contains(rootEl(), activeElement(ownerDocument(rootEl())))
      ) {
        return
      }

      store.closeToast(local.toast.id)
    }
  }

  createEffect(() => {
    const element = rootEl()
    if (!swipeEnabled() || !element) {
      return
    }

    function preventDefaultTouchStart(event: TouchEvent) {
      if (
        activePointerId === null ||
        !contains(element, getTarget(event) as HTMLElement | null)
      ) {
        return
      }

      event.preventDefault()
    }

    onCleanup(
      addEventListener(element, 'touchmove', preventDefaultTouchStart, {
        passive: false,
      })
    )
  })

  function getDragStyles(): JSX.CSSProperties {
    const offset = dragOffset()
    const initial = initialTransform()
    const deltaX = offset.x - initial.x
    const deltaY = offset.y - initial.y

    return {
      transition: isSwiping() ? 'none' : undefined,
      transform: isSwiping()
        ? `translateX(${offset.x}px) translateY(${offset.y}px) scale(${initial.scale})`
        : undefined,
      [ToastRootCssVars.swipeMovementX]: `${deltaX}px`,
      [ToastRootCssVars.swipeMovementY]: `${deltaY}px`,
    }
  }

  const toastAccessor = () => local.toast

  const rootContext = {
    toast: toastAccessor,
    titleIdAssign,
    descriptionIdAssign,
    titleId,
    descriptionId,
    visibleIndex: visibleIndexOf,
    expanded,
    recalculateHeight,
  }

  const state: ToastRootState = {
    get transitionStatus() {
      return toastTransitionStatus()
    },
    get expanded() {
      return expanded()
    },
    get limited() {
      return toastLimited()
    },
    get type() {
      return toastType()
    },
    get swiping() {
      return isSwiping()
    },
    get swipeDirection() {
      return currentSwipeDirection()
    },
  }

  return (
    <ToastRootContext.Provider value={rootContext}>
      {createRender<ToastRootState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: toastRootStateAttributesMapping,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get role() {
            return toastPriority() === 'high' ? 'alertdialog' : 'dialog'
          },
          tabIndex: 0,
          'aria-modal': false,
          get ['aria-labelledby']() {
            return titleId()
          },
          get ['aria-describedby']() {
            return descriptionId()
          },
          get ['aria-hidden']() {
            return toastPriority() === 'high' && !focused() ? true : undefined
          },
          get onPointerDown() {
            return swipeEnabled() ? handlePointerDown : undefined
          },
          get onPointerMove() {
            return swipeEnabled() ? handlePointerMove : undefined
          },
          get onPointerUp() {
            return swipeEnabled() ? handleSwipeEnd : undefined
          },
          get onPointerCancel() {
            return swipeEnabled() ? handleSwipeEnd : undefined
          },
          onKeyDown: handleKeyDown,
          get inert() {
            return inertValue(toastLimited())
          },
          get class() {
            return local.class
          },
          get style() {
            const base: JSX.CSSProperties = {
              ...getDragStyles(),
              [ToastRootCssVars.index]: String(
                toastTransitionStatus() === 'ending'
                  ? domIndexOf()
                  : visibleIndexOf()
              ),
              [ToastRootCssVars.offsetY]: `${offsetYOf()}px`,
              [ToastRootCssVars.height]: toastHeight()
                ? `${toastHeight()}px`
                : undefined,
            }
            const user = local.style
            if (user && typeof user === 'object' && !Array.isArray(user)) {
              return { ...base, ...user }
            }
            return base
          },
          children: local.children,
          ref(element: HTMLElement) {
            rootElAssign(element as HTMLDivElement)
            const userRef = local.ref
            if (typeof userRef === 'function') {
              userRef(element as HTMLDivElement)
            }
          },
        }),
      })}
    </ToastRootContext.Provider>
  )
}
/** Toast object type re-export for Root. */
export type ToastRootToastObject<TData extends object = Record<string, never>> =
  ToastObject<TData>
/** Public state for {@link ToastRoot}. */
export interface ToastRootState extends Record<string, unknown> {
  transitionStatus: TransitionStatus
  expanded: boolean
  limited: boolean
  type: string | undefined
  swiping: boolean
  swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined
}
/** Props for {@link ToastRoot}. */
export type ToastRootProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'toast'
> & {
  toast: ToastRootToastObject
  /**
   * Direction(s) in which the toast can be swiped to dismiss.
   * @default ['down', 'right']
   */
  swipeDirection?:
    | 'up'
    | 'down'
    | 'left'
    | 'right'
    | Array<'up' | 'down' | 'left' | 'right'>
    | undefined
  render?: RenderProp<ToastRootState, Record<string, unknown>>
}
