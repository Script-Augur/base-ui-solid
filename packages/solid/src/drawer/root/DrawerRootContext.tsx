import { createContext, useContext } from 'solid-js'

import type { DrawerRootSnapPointChangeEventDetails } from './DrawerRoot'
import type { Accessor, Setter } from 'solid-js'
/**
 * Drawer-specific root context (swipe / snap / nesting coordination).
 * Dialog open state continues to live on {@link DialogRootContext}.
 */
export const DrawerRootContext = createContext<DrawerRootContextValue>()
/**
 * Reads the nearest {@link DrawerRoot} context.
 *
 * @param optional - When `true`, returns `undefined` outside a root.
 */
export function useDrawerRootContext(optional?: false): DrawerRootContextValue
export function useDrawerRootContext(
  optional: true
): DrawerRootContextValue | undefined
export function useDrawerRootContext(
  optional = false
): DrawerRootContextValue | undefined {
  const context = useContext(DrawerRootContext)
  if (context == null && !optional) {
    throw new Error('Base UI: Drawer parts must be used within <Drawer.Root>.')
  }
  return context
}
/**
 * Creates an idle nested swipe-progress store (Lite: no gesture writes).
 */
export function createNestedSwipeProgressStore(): DrawerNestedSwipeProgressStore {
  let progress = 0
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => progress,
    set(nextProgress) {
      const resolved = Number.isFinite(nextProgress) ? nextProgress : 0
      if (resolved === progress) return
      progress = resolved
      listeners.forEach(listener => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
/** Swipe axis used to dismiss (or open via SwipeArea). */
export type DrawerSwipeDirection = 'up' | 'down' | 'left' | 'right'
/** Snap point: fraction (0–1), pixel number (>1), or `px`/`rem` string. */
export type DrawerSnapPoint = number | string
/**
 * Nested swipe-progress store (Lite: progress stays at 0; API matches upstream).
 */
export interface DrawerNestedSwipeProgressStore {
  getSnapshot: () => number
  subscribe: (listener: () => void) => () => void
  set: (progress: number) => void
}
/**
 * Context value published by {@link DrawerRoot}.
 */
export interface DrawerRootContextValue {
  swipeDirection: Accessor<DrawerSwipeDirection>
  /**
   * Whether `Drawer.SwipeArea` is currently driving an open gesture.
   * Lite: always `false` (no swipe open pipeline).
   */
  swipeAreaActive: Accessor<boolean>
  swipeAreaActiveAssign: Setter<boolean>
  snapToSequentialPoints: Accessor<boolean>
  snapPoints: Accessor<Array<DrawerSnapPoint> | undefined>
  activeSnapPoint: Accessor<DrawerSnapPoint | null>
  setActiveSnapPoint: (
    snapPoint: DrawerSnapPoint | null,
    eventDetails?: DrawerRootSnapPointChangeEventDetails
  ) => void
  frontmostHeight: Accessor<number>
  frontmostHeightAssign: Setter<number>
  popupHeight: Accessor<number>
  popupHeightAssign: Setter<number>
  hasNestedDrawer: Accessor<boolean>
  nestedSwiping: Accessor<boolean>
  nestedSwipeProgressStore: DrawerNestedSwipeProgressStore
  onNestedDrawerPresenceChange: (present: boolean) => void
  onPopupHeightChange: (height: number) => void
  onNestedFrontmostHeightChange: (height: number) => void
  onNestedSwipingChange: (swiping: boolean) => void
  onNestedSwipeProgressChange: (progress: number) => void
  /**
   * Provided to nested drawers so Popup can report open/ending presence to the
   * parent (matches upstream `notifyParentHasNestedDrawer`).
   */
  notifyParentHasNestedDrawer?: ((present: boolean) => void) | undefined
  /**
   * Provided to nested drawers so Popup can report frontmost height while open.
   */
  notifyParentFrontmostHeight?: ((height: number) => void) | undefined
  /** Lite: always `false` — no swipe gesture pipeline. */
  swiping: Accessor<boolean>
  swipingAssign: Setter<boolean>
  /**
   * Whether the active snap point is the full-height expanded state.
   * Upstream: `activeSnapPoint === 1` (literal `1`, not “last snap”).
   */
  expanded: Accessor<boolean>
}
