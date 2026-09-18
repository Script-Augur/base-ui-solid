import { createMemo, createSignal } from 'solid-js'

import {
  DrawerProviderContext,
  
  createVisualStateStore
} from './DrawerProviderContext'

import type {DrawerProviderContextValue} from './DrawerProviderContext';
import type { JSX } from 'solid-js'

/**
 * Provides a shared context for coordinating global Drawer UI, such as
 * indent/background effects based on whether any Drawer is open.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param props - Provider props (`children`).
 * @returns Children wrapped in provider context.
 */
export function DrawerProvider(props: DrawerProviderProps): JSX.Element {
  const [openDrawers, openDrawersAssign] = createSignal(new Set<object>())
  const visualStateStore = createVisualStateStore()

  function setDrawerOpen(drawer: object, open: boolean) {
    openDrawersAssign(prev => {
      if (prev.has(drawer) === open) return prev
      const next = new Set(prev)
      if (open) {
        next.add(drawer)
      } else {
        next.delete(drawer)
      }
      return next
    })
  }

  function removeDrawer(drawer: object) {
    setDrawerOpen(drawer, false)
  }

  const active = createMemo(() => openDrawers().size > 0)

  const contextValue: DrawerProviderContextValue = {
    setDrawerOpen,
    removeDrawer,
    active,
    visualStateStore,
  }

  return (
    <DrawerProviderContext.Provider value={contextValue}>
      {props.children}
    </DrawerProviderContext.Provider>
  )
}

/** Props for {@link DrawerProvider}. */
export type DrawerProviderProps = {
  children?: JSX.Element
}
