import { createContext, useContext } from 'solid-js'

/**
 * Whether `Dialog.Portal` requested `keepMounted`.
 */
export const DialogPortalContext = createContext<boolean | undefined>(undefined)

/**
 * Reads keepMounted from the nearest Dialog portal.
 */
export function useDialogPortalContext(): boolean {
  const value = useContext(DialogPortalContext)
  if (value === undefined) {
    throw new Error(
      'Base UI: <Dialog.Popup> and <Dialog.Viewport> must be used within <Dialog.Portal>.'
    )
  }
  return value
}
