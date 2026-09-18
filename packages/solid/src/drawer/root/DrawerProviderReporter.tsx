import { createEffect, onCleanup } from 'solid-js'

import { useDialogRootContext } from '../../dialog/root/DialogRootContext'
import { useDrawerProviderContext } from '../provider/DrawerProviderContext'

import { useDrawerRootContext } from './DrawerRootContext'

import type { DrawerVisualStateStore } from '../provider/DrawerProviderContext'

/**
 * Reports open state to the nearest {@link DrawerProvider} (Indent / IndentBackground).
 * Mounted from {@link DrawerPopup} so Root children stay a stable Solid slot.
 */
export function DrawerProviderReporter(): null {
  const provider = useDrawerProviderContext()
  const dialog = useDialogRootContext(true)
  const drawer = useDrawerRootContext(true)

  createEffect(() => {
    if (!provider || !dialog) return
    const key = dialog.store
    provider.setDrawerOpen(key, dialog.open())
    onCleanup(() => provider.removeDrawer(key))
  })

  createEffect(() => {
    if (!provider || !drawer) return
    syncProviderVisualState(provider.visualStateStore, {
      swipeProgress: 0,
      frontmostHeight: drawer.frontmostHeight(),
    })
  })

  return null
}

function syncProviderVisualState(
  store: DrawerVisualStateStore,
  next: { swipeProgress: number; frontmostHeight: number }
) {
  store.set(next)
}
