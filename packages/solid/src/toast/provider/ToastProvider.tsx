import { createEffect, onCleanup } from 'solid-js'

import { ToastStore } from '../store'

import { ToastContext } from './ToastProviderContext'

import type { ToastManager } from '../createToastManager'
import type { JSX } from 'solid-js'

/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param props - Provider props (`timeout`, `limit`, `toastManager`, …).
 * @returns Provider JSX wrapping children.
 */
export function ToastProvider(props: ToastProviderProps): JSX.Element {
  const store = new ToastStore({
    timeout: props.timeout ?? 5000,
    limit: props.limit ?? 3,
    viewport: null,
    toasts: [],
    hovering: false,
    focused: false,
    isWindowFocused: true,
    prevFocusElement: null,
  })

  onCleanup(store.disposeEffect())

  createEffect(function subscribeToToastManager() {
    const toastManager = props.toastManager
    if (!toastManager) {
      return
    }

    const unsubscribe = toastManager[' subscribe'](({ action, options }) => {
      const id = options.id

      if (action === 'promise' && options.promise) {
        store.promiseToast(options.promise, options as never)
      } else if (action === 'update' && id) {
        store.updateToast(id, options as never)
      } else if (action === 'close') {
        store.closeToast(id)
      } else {
        store.addToast(options)
      }
    })

    onCleanup(unsubscribe)
  })

  createEffect(() => {
    store.syncProviderProps(props.timeout ?? 5000, props.limit ?? 3)
  })

  return (
    <ToastContext.Provider value={store}>
      {props.children}
    </ToastContext.Provider>
  )
}
/** Props for {@link ToastProvider}. */
export interface ToastProviderProps {
  children?: JSX.Element
  /**
   * The default amount of time (in ms) before a toast is auto dismissed.
   * A value of `0` will prevent the toast from being dismissed automatically.
   * @default 5000
   */
  timeout?: number | undefined
  /**
   * The maximum number of toasts that can be displayed at once.
   * When the limit is exceeded, the oldest toasts are marked as `limited` (via the `data-limited`
   * attribute) rather than removed, so they can be hidden or animated out.
   * @default 3
   */
  limit?: number | undefined
  /**
   * A global manager for toasts to use outside of a Solid component.
   */
  toastManager?: ToastManager | undefined
}
