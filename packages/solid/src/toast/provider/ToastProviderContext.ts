import { createContext, useContext } from 'solid-js'

import type { ToastStore } from '../store'

/**
 * Toast provider context — holds the {@link ToastStore}.
 */
export const ToastContext = createContext<ToastStore>()

/**
 * Reads the toast store from the nearest Provider.
 *
 * @returns The {@link ToastStore}.
 * @throws When used outside `<Toast.Provider>`.
 */
export function useToastProviderContext(): ToastStore {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error(
      'Base UI: useToastManager must be used within <Toast.Provider>.'
    )
  }
  return context
}
