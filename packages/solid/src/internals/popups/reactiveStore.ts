import { createMemo, createSignal } from 'solid-js'

import type { Accessor } from 'solid-js'
/**
 * A data store that allows subscribing to state changes and updating the state.
 * Matches `@base-ui/utils/store` `Store` semantics used by popup handles.
 *
 * @typeParam TState - Mutable state object shape.
 */
export class ReactiveStore<TState extends object> {
  /**
   * Current state snapshot. Updated immediately on `setState` / `update` / `set`.
   * Do not mutate properties directly — use the provided methods.
   */
  state: TState

  private listeners = new Set<(state: TState) => void>()
  private updateTick = 0

  /**
   * Solid version counter so `useState` accessors re-run after updates.
   */
  protected readonly version: Accessor<number>
  private readonly versionAssign: (
    next: number | ((prev: number) => number)
  ) => void

  /**
   * @param state - Initial state object.
   */
  constructor(state: TState) {
    this.state = state
    const [version, versionAssign] = createSignal(0)
    this.version = version
    this.versionAssign = versionAssign
  }

  /**
   * Registers a listener that will be called whenever the store's state changes.
   *
   * @param fn - Listener invoked with the next state.
   * @returns Unsubscribe function.
   */
  subscribe = (fn: (state: TState) => void): (() => void) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  /**
   * Returns the current state snapshot.
   *
   * @returns Current state.
   */
  getSnapshot = (): TState => {
    return this.state
  }

  /**
   * Replaces the entire store state and notifies listeners.
   *
   * @param newState - Next state object.
   */
  setState(newState: TState): void {
    if (this.state === newState) {
      return
    }
    this.state = newState
    this.versionAssign(v => v + 1)
    this.updateTick += 1
    const currentTick = this.updateTick
    for (const listener of this.listeners) {
      if (currentTick !== this.updateTick) {
        return
      }
      listener(newState)
    }
  }

  /**
   * Merges the provided changes into the current state and notifies listeners if there are changes.
   *
   * @param changes - Partial state update.
   */
  update(changes: Partial<TState>): void {
    for (const key in changes) {
      if (
        !Object.is(this.state[key as keyof TState], changes[key as keyof TState])
      ) {
        this.setState({
          ...this.state,
          ...changes,
        })
        return
      }
    }
  }

  /**
   * Sets a specific key in the store's state.
   *
   * @param key - State key.
   * @param value - Next value.
   */
  set<TKey extends keyof TState>(key: TKey, value: TState[TKey]): void {
    if (!Object.is(this.state[key], value)) {
      this.setState({
        ...this.state,
        [key]: value,
      })
    }
  }

  /**
   * Gives the state a new reference and notifies all registered listeners.
   */
  notifyAll(): void {
    this.setState({ ...this.state })
  }
}
/**
 * Store with non-reactive context, selectors, and Solid `useState` accessors.
 * Solid counterpart to `@base-ui/utils/store` `ReactStore`.
 *
 * @typeParam TState - State object.
 * @typeParam TContext - Non-reactive context bag.
 * @typeParam TSelectors - Selector map.
 */
export class SolidStore<
  TState extends object,
  TContext extends object = Record<string, never>,
  TSelectors extends StoreSelectors<TState> = StoreSelectors<TState>,
> extends ReactiveStore<TState> {
  /** Non-reactive values such as refs, callbacks, and trigger maps. */
  context: TContext
  /** Selector functions used by {@link select} / {@link useState}. */
  selectors: TSelectors

  /**
   * @param state - Initial state.
   * @param context - Non-reactive context (defaults to `{}`).
   * @param selectors - Optional selector map.
   */
  constructor(
    state: TState,
    context: TContext = {} as TContext,
    selectors: TSelectors = {} as TSelectors
  ) {
    super(state)
    this.context = context
    this.selectors = selectors
  }

  /**
   * Reads a selector against the current state (non-reactive).
   *
   * @param key - Selector name.
   * @param args - Extra selector arguments.
   * @returns Selector result.
   */
  select<TKey extends keyof TSelectors>(
    key: TKey,
    ...args: Array<unknown>
  ): ReturnType<Extract<TSelectors[TKey], (...args: Array<never>) => unknown>> {
    const selector = this.selectors[key] as (
      state: TState,
      ...a: Array<unknown>
    ) => unknown
    return selector(this.state, ...args) as ReturnType<
      Extract<TSelectors[TKey], (...args: Array<never>) => unknown>
    >
  }

  /**
   * Returns a Solid accessor that re-runs when the store updates.
   * Call during component setup (not inside other reactive scopes repeatedly).
   *
   * @param key - Selector name.
   * @param args - Extra selector arguments (captured; use accessors for live args).
   * @returns Reactive accessor of the selector result.
   */
  useState<TKey extends keyof TSelectors>(
    key: TKey,
    ...args: Array<unknown>
  ): Accessor<
    ReturnType<Extract<TSelectors[TKey], (...args: Array<never>) => unknown>>
  > {
    return createMemo(() => {
      this.version()
      return this.select(key, ...args)
    })
  }
}
/**
 * A {@link SolidStore} whose state never changes.
 *
 * Useful for fallback stores that need to support normal store reads while detached from the
 * component that owns real state. Context values may still contain mutable refs or maps.
 *
 * @typeParam TState - State object.
 * @typeParam TContext - Context bag.
 * @typeParam TSelectors - Selector map.
 */
export class NullStore<
  TState extends object,
  TContext extends object = Record<string, never>,
  TSelectors extends StoreSelectors<TState> = StoreSelectors<TState>,
> extends SolidStore<TState, TContext, TSelectors> {
  override setState(_newState: TState): void {}
  override update(_changes: Partial<TState>): void {}
  override set<TKey extends keyof TState>(
    _key: TKey,
    _value: TState[TKey]
  ): void {}
  override notifyAll(): void {}
}
/**
 * Selector map: each key maps to a function of store state (plus optional args).
 */
export type StoreSelectors<TState> = Record<
  string,
   
  (state: TState, ...args: Array<any>) => unknown
>
