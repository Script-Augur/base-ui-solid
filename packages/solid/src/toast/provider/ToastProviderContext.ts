import { createContext, useContext } from 'solid-js'

import type { ToastStore } from '../store'

const ToastContextValue = createContext<ToastContext | undefined>(undefined)
export { ToastContextValue as ToastContext }
/**
 * Reads the toast store from the nearest Provider.
 *
 * @returns The {@link ToastStore}.
 * @throws When used outside `<Toast.Provider>`.
 */
export function useToastProviderContext(): ToastStore {
  const context = useContext(ToastContextValue)
  if (!context) {
    throw new Error(
      'Base UI: useToastManager must be used within <Toast.Provider>.'
    )
  }
  return context
}
/** Provider context value — the toast store. */
export type ToastContext = ToastStore
