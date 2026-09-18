import { contains } from '@script-augur/base-ui-utils'
import { createEffect, createSignal, onCleanup } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../createChangeEventDetails'
import { NOOP } from '../noop'

import type { BaseUIChangeEventDetails } from '../createChangeEventDetails'
import type {
  PopupHandleStoreProvider,
} from './popupHandle'
import type { PopupTriggerMap } from './popupTriggerMap'
import type {
  PopupStoreState,
  PopupTriggerDataStore,
} from './store'
import type { Accessor, JSX, Setter } from 'solid-js'

export { NOOP }
/**
 * Keeps the Root `triggerElement` signal aligned with the store's
 * `activeTriggerElement` so detached triggers share the same channel as nested
 * ones (Portal focus restore, Positioner reference, outside-press exclusion).
 *
 * Only writes when the store holds an `HTMLElement` — never clears the signal
 * on unrelated store updates, so a nested trigger's legacy assign is not wiped
 * before the popup opens.
 *
 * @param store - Popup store that owns `activeTriggerElement`.
 * @param triggerElementAssign - Root context setter for the trigger element.
 */
export function createActiveTriggerElementSync(
  store: {
    state: { activeTriggerElement: Element | null }
    subscribe: (
      fn: (state: { activeTriggerElement: Element | null }) => void
    ) => () => void
  },
  triggerElementAssign: Setter<HTMLElement | null>
): void {
  createEffect(() => {
    const sync = (state: { activeTriggerElement: Element | null }) => {
      const el = state.activeTriggerElement
      if (el instanceof HTMLElement) {
        triggerElementAssign(el)
      }
    }
    sync(store.state)
    const unsub = store.subscribe(sync)
    onCleanup(unsub)
  })
}
/**
 * Whether a pointer event target is on a registered popup trigger (or the
 * legacy single `triggerElement` fallback).
 *
 * Outside-press dismiss must ignore presses on triggers so click-to-toggle and
 * detached anchors do not immediately close the popup.
 *
 * @param triggerElements - Registered trigger map from the popup store.
 * @param target - Event target element.
 * @param fallbackTrigger - Optional Root `triggerElement` when the map is empty.
 * @returns `true` when the press is on a trigger.
 */
export function isEventOnPopupTrigger(
  triggerElements: PopupTriggerMap,
  target: Element | null,
  fallbackTrigger?: Element | null
): boolean {
  if (!target) {
    return false
  }
  if (fallbackTrigger != null && contains(fallbackTrigger, target)) {
    return true
  }
  return triggerElements.hasMatchingElement(el => contains(el, target))
}
/**
 * Attaches a Root's store to a handle for the Root's lifetime.
 * Call during Root setup when a handle prop is present.
 *
 * @typeParam TStore - Root store type.
 * @param handle - Popup handle (or undefined when unused).
 * @param store - Root-owned store accessor/factory result.
 */
export function createPopupHandleAttachment <TStore>(
  handle: PopupRootStoreHandle<TStore> | undefined,
  store: TStore
): void {
  createEffect(() => {
    if (!handle) return
    onCleanup(handle.attachStore(store))
  })
}
/**
 * Reads the store currently exposed by a popup handle and subscribes to store-pointer changes.
 * Returns `undefined` when no handle is provided so callers can fall back to their root context.
 *
 * @typeParam THandleStore - Store shape exposed by the handle.
 * @param handle - Popup handle, or `undefined` when the trigger is not handle-bound.
 * @returns Reactive accessor of the current handle store (or `undefined`).
 */
export function createPopupHandleStore<THandleStore>(
  handle: PopupHandleStoreProvider<THandleStore> | undefined
): Accessor<THandleStore | undefined> {
  const [store, storeAssign] = createSignal<THandleStore | undefined>(
    handle === undefined ? undefined : handle.store
  )

  createEffect(() => {
    if (handle === undefined) {
      storeAssign(undefined)
      return
    }
    storeAssign(() => handle.store)
    onCleanup(
      handle.subscribeStore(() => {
        storeAssign(() => handle.store)
      })
    )
  })

  return store
}
/**
 * Returns a callback that registers/unregisters the trigger element in the store.
 *
 * @typeParam TState - Popup store state.
 * @param id - Trigger id (undefined skips registration).
 * @param store - Store with a trigger map in context.
 * @returns Registration callback for the trigger element.
 */
export function createTriggerRegistration<
  TState extends PopupStoreState<unknown>,
>(
  id: Accessor<string | undefined>,
  store: Accessor<PopupTriggerDataStore<TState>>
): (element: Element | null) => void {
  let registeredElementId: string | null = null
  let registeredElement: Element | null = null

  return (element: Element | null) => {
    const triggerId = id()
    const activeStore = store()
    if (triggerId === undefined) {
      return
    }

    let shouldSyncTriggerCount = false
    if (registeredElementId !== null) {
      const registeredId = registeredElementId
      const previousElement = registeredElement
      const currentElement =
        activeStore.context.triggerElements.getById(registeredId)
      if (previousElement && currentElement === previousElement) {
        activeStore.context.triggerElements.delete(registeredId)
        shouldSyncTriggerCount = true
      }
      registeredElementId = null
      registeredElement = null
    }

    if (element !== null) {
      registeredElementId = triggerId
      registeredElement = element
      activeStore.context.triggerElements.add(triggerId, element)
      shouldSyncTriggerCount = true
    }

    if (shouldSyncTriggerCount) {
      const triggerCount = activeStore.context.triggerElements.size
      if (
        activeStore.select('open') &&
        activeStore.state.triggerCount !== triggerCount
      ) {
        activeStore.set('triggerCount', triggerCount)
      }
    }
  }
}
/**
 * Updates open-related trigger fields on a partial state object.
 *
 * @param state - Partial state being prepared for `store.update`.
 * @param open - Next open value.
 * @param trigger - Trigger element that caused the change, if any.
 * @param preventUnmountOnClose - Whether to keep the popup mounted after close.
 */
export function setPopupOpenState(
  state: Partial<PopupStoreState<unknown>>,
  open: boolean,
  trigger: Element | undefined,
  preventUnmountOnClose = false
): void {
  if (open) {
    state.preventUnmountingOnClose = false
  } else if (preventUnmountOnClose) {
    state.preventUnmountingOnClose = true
  }
  const triggerId = trigger?.id ?? null

  // If a popup is closing, the `trigger` may be undefined.
  // We want to keep the previous value so that exit animations are played and focus is returned correctly.
  if (triggerId || open) {
    state.activeTriggerId = triggerId
    state.activeTriggerElement = trigger ?? null
  }
}
/**
 * Attaches `preventUnmountOnClose` onto event details and returns a getter for the flag.
 *
 * @param eventDetails - Change event details object.
 * @returns Getter that returns whether unmount should be prevented.
 */
export function attachPreventUnmountOnClose(eventDetails: {
  preventUnmountOnClose: () => void
}): () => boolean {
  let preventUnmountOnClose = false
  eventDetails.preventUnmountOnClose = () => {
    preventUnmountOnClose = true
  }
  return () => preventUnmountOnClose
}
/**
 * Sets up trigger data forwarding to the store (registration + active ownership).
 *
 * @typeParam TState - Popup store state.
 * @param triggerId - Trigger id accessor.
 * @param triggerElement - Trigger element accessor (for refreshes).
 * @param store - Store accessor (follows handle pointer swaps).
 * @param stateUpdates - Extra state applied when this trigger is active (e.g. payload).
 * @returns Registration callback and whether this trigger currently owns the mounted popup.
 */
export function createTriggerDataForwarding<
  TState extends PopupStoreState<unknown>,
>(
  triggerId: Accessor<string | undefined>,
  triggerElement: Accessor<Element | null>,
  store: Accessor<PopupTriggerDataStore<TState>>,
  stateUpdates: Accessor<
    Omit<Partial<TState>, 'activeTriggerId' | 'activeTriggerElement'>
  >
): {
  registerTrigger: (element: Element | null) => void
  isMountedByThisTrigger: Accessor<boolean>
} {
  const [registeredElement, registeredElementAssign] =
    createSignal<Element | null>(null)

  let previousStore: PopupTriggerDataStore<TState> | null = null
  let previousId: string | null = null
  let previousElement: Element | null = null

  function unregisterFrom(
    targetStore: PopupTriggerDataStore<TState>,
    id: string,
    element: Element
  ): void {
    const currentElement = targetStore.context.triggerElements.getById(id)
    if (currentElement === element) {
      targetStore.context.triggerElements.delete(id)
      const triggerCount = targetStore.context.triggerElements.size
      if (
        targetStore.select('open') &&
        targetStore.state.triggerCount !== triggerCount
      ) {
        targetStore.set('triggerCount', triggerCount)
      }
    }
  }

  function applyTriggerData(
    targetStore: PopupTriggerDataStore<TState>,
    id: string | undefined,
    element: Element
  ): void {
    const open = targetStore.select('open')
    const activeTriggerId = targetStore.select('activeTriggerId')
    const updates = stateUpdates()

    if (activeTriggerId === id) {
      targetStore.update({
        activeTriggerElement: element,
        ...(open ? updates : null),
      } as Partial<TState>)
      return
    }
    if (activeTriggerId == null && open) {
      targetStore.update({
        activeTriggerId: id,
        activeTriggerElement: element,
        ...updates,
      } as Partial<TState>)
    }
  }

  createEffect(() => {
    const activeStore = store()
    const id = triggerId()
    const element = registeredElement()

    if (previousStore && previousId !== null && previousElement) {
      unregisterFrom(previousStore, previousId, previousElement)
    }
    previousStore = null
    previousId = null
    previousElement = null

    if (id !== undefined && element !== null) {
      activeStore.context.triggerElements.add(id, element)
      const triggerCount = activeStore.context.triggerElements.size
      if (
        activeStore.select('open') &&
        activeStore.state.triggerCount !== triggerCount
      ) {
        activeStore.set('triggerCount', triggerCount)
      }
      applyTriggerData(activeStore, id, element)
      previousStore = activeStore
      previousId = id
      previousElement = element
    }

    onCleanup(() => {
      if (previousStore && previousId !== null && previousElement) {
        unregisterFrom(previousStore, previousId, previousElement)
        previousStore = null
        previousId = null
        previousElement = null
      }
    })
  })

  const registerTrigger = (element: Element | null) => {
    registeredElementAssign(element)
  }

  const isMountedByThisTrigger = () =>
    store().select('isMountedByTrigger', triggerId())

  // Upstream: useIsoLayoutEffect keyed on useState('isMountedByTrigger').
  // Subscribe to the store so payload/stateUpdates apply when this trigger
  // becomes the mounted owner (open + activeTriggerId), not only on mount.
  createEffect(() => {
    const activeStore = store()
    const id = triggerId()
    const applyMountedUpdates = () => {
      if (activeStore.select('isMountedByTrigger', id)) {
        activeStore.update({
          activeTriggerElement: triggerElement(),
          ...stateUpdates(),
        } as Partial<TState>)
      }
    }
    applyMountedUpdates()
    const unsub = activeStore.subscribe(applyMountedUpdates)
    onCleanup(unsub)
  })

  return {
    registerTrigger,
    isMountedByThisTrigger,
  }
}
/**
 * Keeps trigger registration state synchronized while the popup is open.
 * Call on the Root part.
 *
 * @typeParam TState - Popup store state.
 * @param store - Root store with `setOpen`.
 * @param options - Active-trigger unmount behavior.
 */
export function createImplicitActiveTrigger<
  TState extends PopupStoreState<unknown>,
>(
  store: {
    readonly context: {
      readonly triggerElements: PopupTriggerMap
    }
    readonly state: TState
    subscribe: (listener: (state: TState) => void) => () => void
    select: PopupTriggerDataStore<TState>['select']
    set: PopupTriggerDataStore<TState>['set']
    update: PopupTriggerDataStore<TState>['update']
    setOpen: (
      open: boolean,
      eventDetails: BaseUIChangeEventDetails<typeof REASONS.none>
    ) => void
  },
  options: { closeOnActiveTriggerUnmount?: boolean } = {}
): void {
  const { closeOnActiveTriggerUnmount = false } = options
  let resolvedActiveTriggerId: string | null = null

  function reconcile(): void {
    const open = store.select('open')

    if (!open) {
      resolvedActiveTriggerId = null
      if (store.state.triggerCount !== 0) {
        store.set('triggerCount', 0)
      }
      return
    }

    const triggerCount = store.context.triggerElements.size
    let nextTriggerCount: number | undefined
    let nextActiveTriggerId: string | null | undefined
    let nextActiveTriggerElement: Element | null | undefined
    let didUpdateActiveId = false
    let didUpdateActiveElement = false

    if (store.state.triggerCount !== triggerCount) {
      nextTriggerCount = triggerCount
    }

    const currentActiveTriggerId = store.select('activeTriggerId')
    let lostActiveTriggerId: string | null = null

    if (currentActiveTriggerId) {
      const activeTriggerElement =
        store.context.triggerElements.getById(currentActiveTriggerId)
      if (!activeTriggerElement) {
        let reassociated = false
        for (const [id, triggerEl] of store.context.triggerElements.entries()) {
          if (triggerEl === store.state.activeTriggerElement) {
            nextActiveTriggerId = id
            nextActiveTriggerElement = triggerEl
            didUpdateActiveId = true
            didUpdateActiveElement = true
            resolvedActiveTriggerId = id
            reassociated = true
            break
          }
        }
        if (!reassociated) {
          if (resolvedActiveTriggerId === currentActiveTriggerId) {
            lostActiveTriggerId = currentActiveTriggerId
          } else {
            resolvedActiveTriggerId = null
          }
        }
      } else {
        resolvedActiveTriggerId = currentActiveTriggerId
        if (activeTriggerElement !== store.state.activeTriggerElement) {
          nextActiveTriggerElement = activeTriggerElement
          didUpdateActiveElement = true
        }
      }
    } else {
      resolvedActiveTriggerId = null
    }

    if (
      !lostActiveTriggerId &&
      !currentActiveTriggerId &&
      triggerCount === 1
    ) {
      const iteratorResult = store.context.triggerElements.entries().next()
      if (!iteratorResult.done) {
        const [implicitTriggerId, implicitTriggerElement] =
          iteratorResult.value
        nextActiveTriggerId = implicitTriggerId
        nextActiveTriggerElement = implicitTriggerElement
        didUpdateActiveId = true
        didUpdateActiveElement = true
        resolvedActiveTriggerId = implicitTriggerId
      }
    }

    if (
      nextTriggerCount !== undefined ||
      didUpdateActiveId ||
      didUpdateActiveElement
    ) {
      const stateUpdates: Partial<TState> = {}
      if (nextTriggerCount !== undefined) {
        Object.assign(stateUpdates, { triggerCount: nextTriggerCount })
      }
      if (didUpdateActiveId) {
        Object.assign(stateUpdates, { activeTriggerId: nextActiveTriggerId })
      }
      if (didUpdateActiveElement) {
        Object.assign(stateUpdates, {
          activeTriggerElement: nextActiveTriggerElement,
        })
      }
      store.update(stateUpdates)
    }

    if (lostActiveTriggerId && closeOnActiveTriggerUnmount) {
      const lostId = lostActiveTriggerId
      queueMicrotask(() => {
        if (
          store.select('open') &&
          store.select('activeTriggerId') === lostId &&
          !store.context.triggerElements.getById(lostId)
        ) {
          const eventDetails = createChangeEventDetails(REASONS.none)
          store.setOpen(false, eventDetails)
          if (!eventDetails.isCanceled) {
            store.update({
              activeTriggerId: null,
              activeTriggerElement: null,
            } as Partial<TState>)
          }
        }
      })
    }
  }

  createEffect(() => {
    reconcile()
    onCleanup(store.subscribe(() => reconcile()))
  })
}

/**
 * Whether `children` is a payload render prop (not a Solid zero-arg lazy child).
 *
 * Solid resolves many element children as zero-arg functions. Upstream React
 * uses `typeof === 'function'` alone; Solid must also require `length > 0`
 * (same convention as Solid's `Show`) so we do not call the child as
 * `({ payload }) => …` or subscribe Root to `payload` for normal Portal trees.
 *
 * @param children - Root `children` value.
 * @returns `true` when `children` is a payload render function.
 */
export function isPayloadChildRenderFunction(
  children: unknown
): children is PayloadChildRenderFunction<unknown> {
  return typeof children === 'function' && children.length > 0
}

/**
 * The subset of a popup handle that a Root needs to bind its store to.
 *
 * @typeParam TStore - Root-owned store type.
 */
export interface PopupRootStoreHandle<TStore> {
  attachStore: (store: TStore) => () => void
}

/**
 * Root children render function that receives the active trigger's payload
 * (or the payload from `DialogHandle.openWithPayload`). Matches upstream
 * `@base-ui/react` `PayloadChildRenderFunction`.
 *
 * @typeParam TPayload - Payload type from `createHandle` / trigger `payload`.
 */
export type PayloadChildRenderFunction<TPayload> = (arg: {
  payload: TPayload | undefined
}) => JSX.Element
