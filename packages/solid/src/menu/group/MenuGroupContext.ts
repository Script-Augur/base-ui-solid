import { createContext, useContext } from 'solid-js'

/**
 * Publishes group label id assignment into group descendants.
 */
export const MenuGroupContext = createContext<
  (id: string | undefined) => void
>()

/**
 * Reads the group label id assigner.
 */
export function useMenuGroupContext():
  | ((id: string | undefined) => void)
  | undefined {
  return useContext(MenuGroupContext)
}
