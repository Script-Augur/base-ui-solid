import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { useRenderDialogRoot } from '../../dialog/root/DialogRoot'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'

import {
  DrawerRootContext,
  
  
  
  createNestedSwipeProgressStore,
  useDrawerRootContext
} from './DrawerRootContext'

import type {DrawerRootContextValue, DrawerSnapPoint, DrawerSwipeDirection} from './DrawerRootContext';
import type {
  DialogRootActions,
  DialogRootProps,
} from '../../dialog/root/DialogRoot'
import type { BaseUIChangeEventDetails } from '../../internals/createChangeEventDetails'
import type { DrawerHandle } from '../handle'
import type { JSX } from 'solid-js'
/**
 * Groups all parts of the drawer.
 * Doesn't render its own HTML element.
 *
 * Thin wrapper over Dialog via `useRenderDialogRoot('drawer')`, plus
 * Drawer-specific swipe/snap context. **Lite:** swipe dismiss, snap-point
 * drag, nested swipe coordination, and CloseWatcher are deferred — props are
 * accepted and context exposes idle values so CSS hooks stay stable.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param componentProps - Root props (`open`, `swipeDirection`, `snapPoints`, …).
 * @returns A Solid JSX fragment wrapping children in Drawer + Dialog context.
 *
 * @example
 * ```tsx
 * import { Drawer } from "@script-augur/base-ui-solid/drawer"
 *
 * <Drawer.Root swipeDirection="down">
 *   <Drawer.Trigger>Open</Drawer.Trigger>
 *   <Drawer.Portal>
 *     <Drawer.Backdrop />
 *     <Drawer.Viewport>
 *       <Drawer.Popup>
 *         <Drawer.Title>Title</Drawer.Title>
 *         <Drawer.Close>Close</Drawer.Close>
 *       </Drawer.Popup>
 *     </Drawer.Viewport>
 *   </Drawer.Portal>
 * </Drawer.Root>
 * ```
 */
export function DrawerRoot<TPayload = unknown>(
  componentProps: DrawerRootProps<TPayload>
): JSX.Element {
  const [local, dialogProps] = splitProps(componentProps, [
    'swipeDirection',
    'snapPoints',
    'snapToSequentialPoints',
    'snapPoint',
    'defaultSnapPoint',
    'onSnapPointChange',
    'children',
    'onOpenChange',
    'handle',
  ])

  const parentDrawer = useDrawerRootContext(true)
  const nestedSwipeProgressStore = createNestedSwipeProgressStore()

  const [popupHeight, popupHeightAssign] = createSignal(0)
  const [frontmostHeight, frontmostHeightAssign] = createSignal(0)
  const [hasNestedDrawer, hasNestedDrawerAssign] = createSignal(false)
  const [nestedSwiping, nestedSwipingAssign] = createSignal(false)
  const [swiping, swipingAssign] = createSignal(false)
  const [swipeAreaActive, swipeAreaActiveAssign] = createSignal(false)

  const swipeDirection = () => local.swipeDirection ?? 'down'
  const snapToSequentialPoints = () => local.snapToSequentialPoints ?? false
  const snapPoints = () => local.snapPoints

  const resolvedDefaultSnapPoint = (): DrawerSnapPoint | null => {
    if (local.defaultSnapPoint !== undefined) {
      return local.defaultSnapPoint
    }
    return local.snapPoints?.[0] ?? null
  }

  const [activeSnapPoint, activeSnapPointAssign] = createControlled({
    value: () => local.snapPoint,
    defaultValue: resolvedDefaultSnapPoint(),
  })

  const resolvedActiveSnapPoint = createMemo((): DrawerSnapPoint | null => {
    if (local.snapPoint !== undefined) {
      return activeSnapPoint()
    }
    const points = snapPoints()
    if (!points || points.length === 0) {
      return activeSnapPoint()
    }
    const current = activeSnapPoint()
    if (
      current === null ||
      !points.some(point => Object.is(point, current))
    ) {
      return resolvedDefaultSnapPoint()
    }
    return current
  })

  function setActiveSnapPoint(
    nextSnapPoint: DrawerSnapPoint | null,
    eventDetails?: DrawerRootSnapPointChangeEventDetails
  ) {
    const resolvedEventDetails =
      eventDetails ?? createChangeEventDetails(REASONS.none)
    local.onSnapPointChange?.(nextSnapPoint, resolvedEventDetails)
    if (resolvedEventDetails.isCanceled) return
    activeSnapPointAssign(nextSnapPoint)
  }

  const expanded = createMemo(() => {
    const points = snapPoints()
    if (!points || points.length === 0) return true
    const active = resolvedActiveSnapPoint()
    if (active == null) return false
    return Object.is(active, points[points.length - 1])
  })

  const isNestedDrawerOpenRef = { current: false }

  function onPopupHeightChange(height: number) {
    popupHeightAssign(height)
    if (!isNestedDrawerOpenRef.current && height > 0) {
      frontmostHeightAssign(height)
    }
  }

  function onNestedFrontmostHeightChange(height: number) {
    if (height > 0) {
      isNestedDrawerOpenRef.current = true
      frontmostHeightAssign(height)
      return
    }
    isNestedDrawerOpenRef.current = false
    if (popupHeight() > 0) {
      frontmostHeightAssign(popupHeight())
    }
  }

  function onNestedDrawerPresenceChange(present: boolean) {
    hasNestedDrawerAssign(present)
  }

  function onNestedSwipeProgressChange(progress: number) {
    nestedSwipeProgressStore.set(progress)
    parentDrawer?.onNestedSwipeProgressChange(progress)
  }

  function onNestedSwipingChange(next: boolean) {
    nestedSwipingAssign(next)
    parentDrawer?.onNestedSwipingChange(next)
  }

  function handleOpenChange(
    nextOpen: boolean,
    eventDetails: DrawerRootChangeEventDetails
  ) {
    local.onOpenChange?.(nextOpen, eventDetails)
    if (eventDetails.isCanceled) return
    if (!nextOpen) {
      const points = snapPoints()
      if (points && points.length > 0) {
        setActiveSnapPoint(
          resolvedDefaultSnapPoint(),
          createChangeEventDetails(
            eventDetails.reason,
            eventDetails.event,
            eventDetails.trigger
          )
        )
      }
      swipingAssign(false)
    }
  }

  const drawerContext: DrawerRootContextValue = {
    swipeDirection,
    swipeAreaActive,
    swipeAreaActiveAssign,
    snapToSequentialPoints,
    snapPoints,
    activeSnapPoint: resolvedActiveSnapPoint,
    setActiveSnapPoint,
    frontmostHeight,
    frontmostHeightAssign,
    popupHeight,
    popupHeightAssign,
    hasNestedDrawer,
    nestedSwiping,
    nestedSwipeProgressStore,
    onNestedDrawerPresenceChange,
    onPopupHeightChange,
    onNestedFrontmostHeightChange,
    onNestedSwipingChange,
    onNestedSwipeProgressChange,
    swiping,
    swipingAssign,
    expanded,
  }

  createEffect(() => {
    const notify = parentDrawer?.onNestedDrawerPresenceChange
    if (!notify) return
    notify(true)
    onCleanup(() => notify(false))
  })

  createEffect(() => {
    parentDrawer?.onNestedFrontmostHeightChange(frontmostHeight())
  })

  // Inner component so `useRenderDialogRoot` runs once on mount (not in a
  // Provider `children` getter that can re-invoke and recreate DialogStore).
  return (
    <DrawerRootContext.Provider value={drawerContext}>
      <DrawerDialogRoot
        {...(mergeProps(dialogProps, {
          handle: local.handle,
          onOpenChange:
            handleOpenChange as DialogRootProps<TPayload>['onOpenChange'],
          get children() {
            return local.children
          },
        }))}
      />
    </DrawerRootContext.Provider>
  )
}
/**
 * Props for {@link DrawerRoot}.
 *
 * @typeParam TPayload - Optional payload type from `createHandle` / trigger `payload`.
 */
export type DrawerRootProps<TPayload = unknown> = Omit<
  DialogRootProps<TPayload>,
  'handle' | 'onOpenChange'
> & {
  /**
   * A handle to associate the drawer with a trigger.
   * Can be created with `Drawer.createHandle()`.
   */
  handle?: DrawerHandle<TPayload>
  /** Called when the drawer should open or close. */
  onOpenChange?: (
    open: boolean,
    eventDetails: DrawerRootChangeEventDetails
  ) => void
  /**
   * The swipe direction used to dismiss the drawer.
   * @default 'down'
   */
  swipeDirection?: DrawerSwipeDirection
  /**
   * Snap points used to position the drawer.
   * Lite: accepted and reflected in context; drag-to-snap is deferred.
   */
  snapPoints?: Array<DrawerSnapPoint>
  /**
   * Disables velocity-based snap skipping.
   * @default false
   */
  snapToSequentialPoints?: boolean
  /** Controlled active snap point. */
  snapPoint?: DrawerSnapPoint | null
  /** Uncontrolled initial snap point. */
  defaultSnapPoint?: DrawerSnapPoint | null
  /** Called when the snap point changes. */
  onSnapPointChange?: (
    snapPoint: DrawerSnapPoint | null,
    eventDetails: DrawerRootSnapPointChangeEventDetails
  ) => void
}
/** Imperative actions exposed via `actionsRef`. */
export type DrawerRootActions = DialogRootActions
/** Change-event reason for Drawer. */
export type DrawerRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closeWatcher
  | typeof REASONS.closePress
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.swipe
  | typeof REASONS.none
/** Change-event details for Drawer. */
export type DrawerRootChangeEventDetails =
  BaseUIChangeEventDetails<DrawerRootChangeEventReason> & {
    preventUnmountOnClose: () => void
  }
/** Snap-point change reason (same union as open-change). */
export type DrawerRootSnapPointChangeEventReason = DrawerRootChangeEventReason
/** Snap-point change details. */
export type DrawerRootSnapPointChangeEventDetails =
  BaseUIChangeEventDetails<DrawerRootSnapPointChangeEventReason>
function DrawerDialogRoot<TPayload = unknown>(
  props: DialogRootProps<TPayload>
): JSX.Element {
  return useRenderDialogRoot('drawer', props)
}
