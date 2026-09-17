import {
  Timeout,
  activeElement,
  contains,
  generateId,
  getTarget,
  ownerDocument,
} from '@script-augur/base-ui-utils'
import { createSignal } from 'solid-js'

import { isFocusVisible } from './utils/focusVisible'
import { resolvePromiseOptions } from './utils/resolvePromiseOptions'

import type {
  ToastManagerAddOptions,
  ToastManagerPromiseOptions,
  ToastManagerUpdateOptions,
  ToastObject,
} from './useToastManager'
import type { Accessor } from 'solid-js'
/** Named selectors over {@link State}. */
export const selectors = {
  toasts: (state: State) => state.toasts,
  isEmpty: (state: State) => state.toasts.length === 0,
  toast: (state: State, id: string) => state.toastMetadata.get(id)?.value,
  toastIndex: (state: State, id: string) =>
    state.toastMetadata.get(id)?.domIndex ?? -1,
  toastOffsetY: (state: State, id: string) =>
    state.toastMetadata.get(id)?.offsetY ?? 0,
  toastVisibleIndex: (state: State, id: string) =>
    state.toastMetadata.get(id)?.visibleIndex ?? -1,
  focused: (state: State) => state.focused,
  expanded: (state: State) => state.hovering || state.focused,
  expandedOrOutOfFocus: (state: State) =>
    state.hovering || state.focused || !state.isWindowFocused,
  prevFocusElement: (state: State) => state.prevFocusElement,
}
/**
 * Immutable toast store with Solid reactivity via a version signal.
 * Port of Base UI `@base-ui/react` ToastStore (v1.7.0).
 */
export class ToastStore {
  /** Current state snapshot (do not mutate — use `set` / `update` / `setState`). */
  state: State

  private timers = new Map<string, TimerInfo>()

  private areTimersPaused = false

  private version: Accessor<number>

  private versionAssign: (value: number | ((prev: number) => number)) => void

  private updateTick = 0

  private listeners = new Set<(state: State) => void>()

  constructor(initialState: InitialState) {
    this.state = {
      ...initialState,
      toastMetadata: createToastMetadata(initialState.toasts),
    }
    const [version, versionAssign] = createSignal(0)
    this.version = version
    this.versionAssign = versionAssign
  }

  /**
   * Solid accessor over a named selector. Reading tracks the store version.
   *
   * @param key - Selector name.
   * @param args - Extra selector arguments (e.g. toast id).
   * @returns Reactive accessor for the selected value.
   */
  select<TKey extends keyof typeof selectors>(
    key: TKey,
    ...args: SelectorArgs<(typeof selectors)[TKey]>
  ): Accessor<ReturnType<(typeof selectors)[TKey]>> {
    return () => {
      this.version()
      const selector = selectors[key] as (
        state: State,
        ...params: Array<unknown>
      ) => ReturnType<(typeof selectors)[TKey]>
      return selector(this.state, ...args)
    }
  }

  /**
   * Replaces the entire state and notifies listeners / bumps version.
   *
   * @param newState - Next state object.
   */
  setState(newState: State) {
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
   * Merges partial changes into state when any key differs.
   *
   * @param changes - Partial state update.
   */
  update(changes: Partial<State>) {
    for (const key in changes) {
      if (
        !Object.is(this.state[key as keyof State], changes[key as keyof State])
      ) {
        this.setState({ ...this.state, ...changes })
        return
      }
    }
  }

  /**
   * Sets a single state key when the value differs.
   *
   * @param key - State key.
   * @param value - Next value.
   */
  set<TKey extends keyof State>(key: TKey, value: State[TKey]) {
    if (!Object.is(this.state[key], value)) {
      this.setState({ ...this.state, [key]: value })
    }
  }

  setViewport = (viewport: HTMLElement | null) => {
    this.set('viewport', viewport)
  }

  /**
   * Syncs Provider `timeout` / `limit` props; recomputes `limited` when limit changes.
   *
   * @param timeout - Default auto-dismiss timeout.
   * @param limit - Max visible (non-limited) toasts.
   */
  syncProviderProps(timeout: number, limit: number) {
    const limitChanged = this.state.limit !== limit

    if (this.state.timeout === timeout && !limitChanged) {
      return
    }

    const updates: Partial<State> = {
      timeout,
      limit,
    }

    if (limitChanged) {
      const newToasts = applyLimited(this.state.toasts, limit)
      updates.toasts = newToasts
      updates.toastMetadata = createToastMetadata(newToasts)
    }

    this.update(updates)
  }

  /**
   * Returns an effect cleanup that clears all dismiss timers.
   *
   * @returns Cleanup function for `onCleanup`.
   */
  disposeEffect = () => {
    return () => {
      this.timers.forEach(timer => {
        timer.timeout?.clear()
      })
      this.timers.clear()
    }
  }

  /**
   * Removes a toast from the list (after exit animation).
   *
   * @param toastId - Toast id.
   * @param skipOnRemove - When true, skip `onRemove`.
   */
  removeToast(toastId: string, skipOnRemove: boolean = false) {
    const index = selectors.toastIndex(this.state, toastId)
    if (index === -1) {
      return
    }

    const toast = this.state.toasts[index]
    if (!skipOnRemove) {
      toast?.onRemove?.()
    }

    const newToasts = [...this.state.toasts]
    newToasts.splice(index, 1)
    this.setToasts(newToasts)
  }

  addToast = <TData extends object>(
    toast: ToastManagerAddOptions<TData>
  ): string => {
    const { timeout, limit } = this.state
    const id = toast.id || generateId('toast')

    if (toast.id) {
      const existingToast = selectors.toast(this.state, toast.id)

      if (existingToast) {
        if (existingToast.transitionStatus === 'ending') {
          this.removeToast(toast.id, true)
        } else {
          const {
            id: _ignoredId,
            transitionStatus: _ignoredTransitionStatus,
            ...updates
          } = toast
          this.updateToastInternal(toast.id, updates, true, true)
          return toast.id
        }
      }
    }

    const toastToAdd = {
      ...toast,
      id,
      updateKey: 0,
      transitionStatus: 'starting' as const,
    } as StoredToast

    const updatedToasts = [toastToAdd, ...this.state.toasts]
    this.setToasts(applyLimited(updatedToasts, limit))

    const duration = toastToAdd.timeout ?? timeout
    if (toastToAdd.type !== 'loading' && duration > 0) {
      this.scheduleTimer(id, duration, () => this.closeToast(id))
    }

    if (selectors.expandedOrOutOfFocus(this.state)) {
      this.pauseTimers()
    }

    return id
  }

  updateToast = <TData extends object>(
    id: string,
    updates: ToastManagerUpdateOptions<TData>
  ) => {
    this.updateToastInternal(id, updates, false, true)
  }

  updateToastInternal = <TData extends object>(
    id: string,
    updates: ToastInternalUpdateOptions<TData>,
    resetTimer: boolean = false,
    markUpdated: boolean = false
  ) => {
    const { timeout, toasts } = this.state
    const prevToast = selectors.toast(this.state, id)
    if (!prevToast) {
      return
    }

    // Ignore updates for toasts that are already closing.
    if (prevToast.transitionStatus === 'ending') {
      return
    }

    const nextToast = {
      ...prevToast,
      ...updates,
      ...(markUpdated && {
        updateKey: prevToast.updateKey + 1,
      }),
    } as StoredToast

    this.setToasts(toasts.map(toast => (toast.id === id ? nextToast : toast)))

    const nextTimeout = nextToast.timeout ?? timeout
    const prevTimeout = prevToast.timeout ?? timeout

    const timeoutUpdated = Object.hasOwn(updates, 'timeout')

    const shouldHaveTimer =
      nextToast.transitionStatus !== 'ending' &&
      nextToast.type !== 'loading' &&
      nextTimeout > 0

    const hasTimer = this.timers.has(id)
    const timeoutChanged = prevTimeout !== nextTimeout
    const wasLoading = prevToast.type === 'loading'

    if (!shouldHaveTimer && hasTimer) {
      this.clearTimer(id)
      return
    }

    if (
      shouldHaveTimer &&
      (!hasTimer ||
        timeoutChanged ||
        timeoutUpdated ||
        wasLoading ||
        resetTimer)
    ) {
      this.clearTimer(id)

      this.scheduleTimer(id, nextTimeout, () => this.closeToast(id))

      if (selectors.expandedOrOutOfFocus(this.state)) {
        this.pauseTimers()
      }
    }
  }

  closeToast = (toastId?: string) => {
    const closeAll = toastId === undefined
    const { limit, toasts } = this.state
    let toastsToClose: Array<StoredToast>

    if (closeAll) {
      toastsToClose = toasts
      this.clearTimers()
    } else {
      const toast = selectors.toast(this.state, toastId)
      if (!toast) {
        return
      }
      toastsToClose = [toast]
      this.clearTimer(toastId)
    }

    const endingToasts = toasts.map(item =>
      closeAll || item.id === toastId
        ? { ...item, transitionStatus: 'ending' as const, height: 0 }
        : item
    )
    const newToasts = applyLimited(endingToasts, limit)
    this.setToasts(
      newToasts,
      !newToasts.some(toast => toast.transitionStatus !== 'ending')
    )

    toastsToClose.forEach(toast => {
      if (toast.transitionStatus !== 'ending') {
        toast.onClose?.()
      }
    })

    this.handleFocusManagement(toastId)
  }

  promiseToast = <TValue, TData extends object>(
    promiseValue: Promise<TValue>,
    options: ToastManagerPromiseOptions<TValue, TData> & {
      setPromise?: (promise: Promise<TValue>) => void
    }
  ): Promise<TValue> => {
    const loadingOptions = resolvePromiseOptions(options.loading)
    const id = this.addToast({
      ...loadingOptions,
      type: 'loading',
    })

    const handledPromise = promiseValue
      .then((result: TValue) => {
        const successOptions = resolvePromiseOptions(options.success, result)
        this.updateToast(id, {
          ...successOptions,
          type: 'success',
          timeout: successOptions.timeout,
        })

        return result
      })
      .catch((error: unknown) => {
        const errorOptions = resolvePromiseOptions(options.error, error)
        this.updateToast(id, {
          ...errorOptions,
          type: 'error',
          timeout: errorOptions.timeout,
        })

        return Promise.reject(error)
      })

    if (Object.hasOwn(options, 'setPromise')) {
      options.setPromise?.(handledPromise)
    }

    return handledPromise
  }

  pauseTimers() {
    if (this.areTimersPaused) {
      return
    }
    this.areTimersPaused = true
    this.timers.forEach(timer => {
      if (timer.timeout) {
        timer.timeout.clear()
        timer.remaining = Math.max(
          timer.remaining - (Date.now() - timer.start),
          0
        )
      }
    })
  }

  resumeTimers() {
    if (!this.areTimersPaused) {
      return
    }
    this.areTimersPaused = false
    this.timers.forEach((timer, id) => {
      timer.remaining = timer.remaining > 0 ? timer.remaining : timer.delay
      timer.timeout ??= new Timeout()
      timer.timeout.start(timer.remaining, () => {
        this.handleTimerFired(id)
        timer.callback()
      })
      timer.start = Date.now()
    })
  }

  restoreFocusToPrevElement() {
    this.state.prevFocusElement?.focus({ preventScroll: true })
  }

  handleDocumentPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') {
      return
    }

    const target = getTarget(event) as Element | null
    if (contains(this.state.viewport, target)) {
      return
    }

    this.resumeTimers()
    this.update({ hovering: false, focused: false })
  }

  private scheduleTimer(id: string, delay: number, callback: () => void) {
    const start = Date.now()
    const shouldStartActive = !selectors.expandedOrOutOfFocus(this.state)
    const currentTimeout = shouldStartActive ? new Timeout() : undefined

    currentTimeout?.start(delay, () => {
      this.handleTimerFired(id)
      callback()
    })

    this.timers.set(id, {
      timeout: currentTimeout,
      start,
      delay,
      remaining: delay,
      callback,
    })
  }

  private clearTimers() {
    this.timers.forEach(timer => {
      timer.timeout?.clear()
    })
    this.timers.clear()
    this.areTimersPaused = false
  }

  private clearTimer(id: string) {
    const timer = this.timers.get(id)
    timer?.timeout?.clear()
    this.timers.delete(id)

    this.resetPausedStateIfNoTimersRemain()
  }

  private handleTimerFired(id: string) {
    this.timers.delete(id)
    this.resetPausedStateIfNoTimersRemain()
  }

  private resetPausedStateIfNoTimersRemain() {
    if (this.timers.size === 0) {
      this.areTimersPaused = false
    }
  }

  private setToasts(
    newToasts: Array<StoredToast>,
    clearInteraction: boolean = newToasts.length === 0
  ) {
    const updates: Partial<State> = {
      toasts: newToasts,
      toastMetadata: createToastMetadata(newToasts),
    }
    if (clearInteraction) {
      updates.hovering = false
      updates.focused = false
    }
    this.update(updates)
  }

  private handleFocusManagement(toastId: string | undefined) {
    const activeEl = activeElement(ownerDocument(this.state.viewport))
    if (
      !this.state.viewport ||
      !contains(this.state.viewport, activeEl) ||
      !isFocusVisible(activeEl)
    ) {
      return
    }

    if (toastId === undefined) {
      this.restoreFocusToPrevElement()
      return
    }

    const toasts = selectors.toasts(this.state)
    const currentIndex = selectors.toastIndex(this.state, toastId)

    const scan = (from: number, step: number) => {
      for (
        let index = from;
        index >= 0 && index < toasts.length;
        index += step
      ) {
        const candidate = toasts[index]
        if (candidate && candidate.transitionStatus !== 'ending') {
          return candidate
        }
      }
      return null
    }

    const nextToast = scan(currentIndex + 1, 1) ?? scan(currentIndex - 1, -1)

    if (nextToast) {
      nextToast.ref?.focus()
    } else {
      this.restoreFocusToPrevElement()
    }
  }
}
/**
 * A toast once it lives in the store. `addToast` is the only way in and it always
 * assigns `updateKey`, so unlike the public `ToastObject` it is never missing.
 */
export type StoredToast<TData extends object = object> = ToastObject<TData> & {
  updateKey: number
}
/** Toast store state snapshot. */
export type State = {
  toasts: Array<StoredToast>
  toastMetadata: Map<string, ToastMetadata>
  hovering: boolean
  focused: boolean
  timeout: number
  limit: number
  isWindowFocused: boolean
  viewport: HTMLElement | null
  prevFocusElement: HTMLElement | null
}
function createToastMetadata(toasts: Array<StoredToast>) {
  const metadata = new Map<string, ToastMetadata>()
  let visibleIndex = 0
  let offsetY = 0

  toasts.forEach((toast, toastIndex) => {
    const isEnding = toast.transitionStatus === 'ending'
    metadata.set(toast.id, {
      value: toast,
      domIndex: toastIndex,
      visibleIndex: isEnding ? -1 : visibleIndex,
      offsetY,
    })

    offsetY += toast.height || 0

    if (!isEnding) {
      visibleIndex += 1
    }
  })

  return metadata
}
// Marks the active (non-ending) toasts beyond `limit` as limited. Callers pass
// toasts in newest-first order, so the newest `limit` toasts stay visible and
// the rest are flagged. Returns the same toast reference when its `limited`
// flag is unchanged to avoid unnecessary re-renders.
function applyLimited(
  toasts: Array<StoredToast>,
  limit: number
): Array<StoredToast> {
  let activeIndex = 0
  return toasts.map(toast => {
    if (toast.transitionStatus === 'ending') {
      return toast
    }
    const limited = activeIndex >= limit
    activeIndex += 1
    return toast.limited === limited ? toast : { ...toast, limited }
  })
}
type ToastInternalUpdateOptions<TData extends object> = Partial<
  Omit<ToastObject<TData>, 'id' | 'updateKey'>
>
type ToastMetadata = {
  value: StoredToast
  domIndex: number
  visibleIndex: number
  offsetY: number
}
type InitialState = Omit<State, 'toastMetadata'>
type SelectorArgs<TSelector> = TSelector extends (
  state: State,
  ...params: infer Params
) => unknown
  ? Params
  : never
interface TimerInfo {
  timeout?: Timeout | undefined
  /** Timestamp of the last time the timeout started running. */
  start: number
  /** Full timeout duration, used to restart a timer that elapsed while throttled. */
  delay: number
  /** Time left before the toast auto-dismisses, excluding any paused time. */
  remaining: number
  callback: () => void
}
