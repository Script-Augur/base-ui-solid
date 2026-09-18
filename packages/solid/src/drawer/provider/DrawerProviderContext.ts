import { createContext, useContext } from 'solid-js'

import type { Accessor } from 'solid-js'
/**
 * Shared context for coordinating global Drawer UI (Indent / IndentBackground).
 */
export const DrawerProviderContext =
  createContext<DrawerProviderContextValue>()
/**
 * Reads the nearest {@link DrawerProvider} context (optional).
 */
export function useDrawerProviderContext():
  | DrawerProviderContextValue
  | undefined {
  return useContext(DrawerProviderContext)
}
/**
 * Creates a visual-state store for Indent CSS vars (Lite: mostly idle).
 */
export function createVisualStateStore(): DrawerVisualStateStore {
  let state: DrawerVisualState = {
    swipeProgress: 0,
    frontmostHeight: 0,
  }
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => state,
    set(nextState) {
      let nextSwipeProgress = state.swipeProgress
      if (nextState.swipeProgress !== undefined) {
        nextSwipeProgress = Number.isFinite(nextState.swipeProgress)
          ? nextState.swipeProgress
          : 0
      }
      let nextFrontmostHeight = state.frontmostHeight
      if (nextState.frontmostHeight !== undefined) {
        nextFrontmostHeight = Number.isFinite(nextState.frontmostHeight)
          ? nextState.frontmostHeight
          : 0
      }
      if (
        nextSwipeProgress === state.swipeProgress &&
        nextFrontmostHeight === state.frontmostHeight
      ) {
        return
      }
      state = {
        swipeProgress: nextSwipeProgress,
        frontmostHeight: nextFrontmostHeight,
      }
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
export interface DrawerVisualState {
  swipeProgress: number
  frontmostHeight: number
}
export interface DrawerVisualStateStore {
  getSnapshot: () => DrawerVisualState
  subscribe: (listener: () => void) => () => void
  set: (state: Partial<DrawerVisualState>) => void
}
export interface DrawerProviderContextValue {
  setDrawerOpen: (drawer: object, open: boolean) => void
  removeDrawer: (drawer: object) => void
  /** Whether any registered drawer is currently open. */
  active: Accessor<boolean>
  visualStateStore: DrawerVisualStateStore
}
