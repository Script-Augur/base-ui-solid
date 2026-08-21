import { createContext, createMemo, useContext } from 'solid-js'

import type { Accessor, JSX, ParentProps } from 'solid-js'

const DEFAULT_DIRECTION: TextDirection = 'ltr'

/**
 * Context carrying writing direction for nested Base UI parts.
 */
const DirectionContext = createContext<DirectionContextValue>({
  direction: () => DEFAULT_DIRECTION,
})

export { DirectionContext }

/**
 * Provides text direction to descendant components.
 *
 * @param props - Optional `direction` and children.
 * @returns Context provider element.
 *
 * @example
 * ```tsx
 * import { DirectionProvider, useDirection } from "@script-augur/base-ui-solid"
 *
 * function App() {
 *   return (
 *     <DirectionProvider direction="rtl">
 *       <Child />
 *     </DirectionProvider>
 *   )
 * }
 *
 * function Child() {
 *   const direction = useDirection()
 *   return <div dir={direction()}>…</div>
 * }
 * ```
 */
export function DirectionProvider(props: DirectionProviderProps): JSX.Element {
  const value: DirectionContextValue = {
    direction: createMemo(() => props.direction ?? DEFAULT_DIRECTION),
  }
  return (
    <DirectionContext.Provider value={value}>
      {props.children}
    </DirectionContext.Provider>
  )
}

/**
 * Reads the nearest {@link DirectionProvider} direction accessor.
 *
 * @returns Accessor for `"ltr"` | `"rtl"`. Defaults to `"ltr"` when no provider
 *   is present.
 *
 * @example
 * ```tsx
 * const direction = useDirection()
 * // direction() === "ltr" | "rtl"
 * ```
 */
export function useDirection(): Accessor<TextDirection> {
  return useContext(DirectionContext).direction
}

/** Text direction for RTL-aware components. */
export type TextDirection = 'ltr' | 'rtl'

/** Value provided by {@link DirectionProvider}. */
export interface DirectionContextValue {
  /** Current text direction accessor. */
  direction: Accessor<TextDirection>
}

/** Props for {@link DirectionProvider}. */
export interface DirectionProviderProps extends ParentProps {
  /** Text direction. Defaults to `"ltr"`. */
  direction?: TextDirection
}
