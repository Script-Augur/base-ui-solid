/**
 * Creates a frozen pub/sub store with `getState` / `setState` / `subscribe`.
 *
 * This is a framework-agnostic helper (not Solid's reactive `createStore`). Use
 * it for shared non-UI state; prefer Solid stores inside components.
 *
 * @typeParam T - Store state shape (must be an object).
 * @param initialState - Initial state object.
 * @returns A frozen {@link Store} instance.
 *
 * @example
 * ```ts
 * import { createStore } from "@script-augur/base-ui-utils"
 *
 * const store = createStore({ count: 0 })
 * const unsubscribe = store.subscribe((state) => {
 *   console.log(state.count)
 * })
 * store.setState({ count: 1 })
 * store.setState((prev) => ({ count: prev.count + 1 }))
 * unsubscribe()
 * ```
 */
export function createStore<T extends object>(initialState: T): Store<T> {
  let state = initialState
  const listeners = new Set<Listener<T>>()

  return Object.freeze({
    /**
     * Returns the current state snapshot.
     *
     * @returns The current state object.
     */
    getState() {
      return state
    },

    /**
     * Merges a partial update into state and notifies subscribers.
     *
     * @param partial - Object to merge, or a function of the previous state that
     *   returns a partial update.
     */
    setState(partial: Partial<T> | ((state: T) => Partial<T>)) {
      const nextPartial =
        typeof partial === 'function' ? partial(state) : partial
      state = { ...state, ...nextPartial }
      for (const listener of listeners) {
        listener(state)
      }
    },

    /**
     * Subscribes to state changes.
     *
     * @param listener - Called with the next state after each `setState`.
     * @returns Unsubscribe function.
     */
    subscribe(listener: Listener<T>) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  })
}

/**
 * Listener invoked whenever store state changes.
 *
 * @typeParam T - Store state shape.
 * @param state - The latest store state after the update.
 */
export type Listener<T> = (state: T) => void

/**
 * Minimal pub/sub store used by Base UI utilities (not Solid's `createStore`).
 *
 * @typeParam T - Store state shape (must be an object).
 */
export interface Store<T> {
  /**
   * Returns the current state snapshot.
   *
   * @returns The current state object.
   */
  getState: () => T
  /**
   * Merges a partial update into state and notifies subscribers.
   *
   * @param partial - Object to merge, or a function of the previous state that
   *   returns a partial update.
   */
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void
  /**
   * Subscribes to state changes.
   *
   * @param listener - Called with the next state after each `setState`.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: Listener<T>) => () => void
}
