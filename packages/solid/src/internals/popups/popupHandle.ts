import { AnimationFrame } from '@script-augur/base-ui-utils'

import {
  REASONS,
  createChangeEventDetails,
} from '../createChangeEventDetails'

import type { BaseUIChangeEventDetails } from '../createChangeEventDetails'
import type { PopupTriggerMap } from './popupTriggerMap'
/**
 * Shared implementation for popup handles that coordinate detached triggers with a mounted root.
 *
 * Subclasses provide the component-specific imperative methods, while this base class owns the
 * fallback store, root store attachment stack, subscriber notifications, and development warning for
 * overlapping roots.
 *
 * @typeParam THandleStore - Store shape exposed to detached triggers.
 * @typeParam TStore - Root-owned store attached by the component root.
 */
export class BasePopupHandle<
  THandleStore extends PopupHandleStoreWithTriggers,
  TStore extends THandleStore & PopupHandleStoreWithOpen,
> implements PopupHandleStoreProvider<THandleStore> {
  protected readonly fallbackStore: THandleStore
  private readonly componentName: string
  private readonly throwOnMissingTrigger: boolean

  /**
   * Stores of every root currently using this handle, in attach order.
   */
  private readonly attachedStores: Array<TStore> = []

  /**
   * Store of the root that currently controls the handle, or `null` when none.
   */
  private attachedStoreValue: TStore | null = null

  /**
   * Listeners notified when `attachedStore` changes.
   */
  private readonly storeListeners = new Set<() => void>()

  /**
   * Dev-only overlap warning frame.
   */
  private overlapWarningFrame: AnimationFrame | undefined

  /**
   * Creates a handle backed by the store used while no root is attached.
   *
   * @param fallbackStore - Inert store handed to detached triggers while no root is attached.
   * @param componentName - Component name used to prefix dev warnings (e.g. `'Menu'`).
   * @param throwOnMissingTrigger - Whether `open(triggerId)` throws when no trigger with that id is
   *   registered. Anchored popups throw; Dialog opens unassociated with a warning instead.
   */
  constructor(
    fallbackStore: THandleStore,
    componentName: string,
    throwOnMissingTrigger = true
  ) {
    this.fallbackStore = fallbackStore
    this.componentName = componentName
    this.throwOnMissingTrigger = throwOnMissingTrigger
  }

  protected get attachedStore(): TStore | null {
    return this.attachedStoreValue
  }

  /**
   * Store that detached triggers read from: the attached root's store, or an inert fallback store
   * used while no root is attached.
   * @internal
   */
  get store(): THandleStore {
    return this.attachedStoreValue ?? this.fallbackStore
  }

  /**
   * Stable fallback store used for server rendering and hydration.
   * @internal
   */
  get serverStore(): THandleStore {
    return this.fallbackStore
  }

  /**
   * Subscribes to changes of the attached store pointer so detached triggers re-bind
   * when a root attaches or detaches.
   *
   * @param listener - Called when the active store pointer changes.
   * @returns Unsubscribe function.
   * @internal
   */
  subscribeStore(listener: () => void): () => void {
    this.storeListeners.add(listener)
    return () => {
      this.storeListeners.delete(listener)
    }
  }

  /**
   * Points the handle at a root's store and notifies subscribers. Returns a cleanup that detaches.
   *
   * @param newStore - Root-owned store to attach.
   * @returns Detach cleanup.
   * @internal
   */
  attachStore(newStore: TStore): () => void {
    this.attachedStores.push(newStore)
    this.setActiveStore(newStore)
    if (process.env.NODE_ENV !== 'production') {
      if (this.attachedStores.length > 1) {
        const frame = (this.overlapWarningFrame ??= AnimationFrame.create())
        frame.request(() => {
          if (this.attachedStores.length > 1) {
            console.warn(
              'Base UI: A handle is attached to more than one mounted root at the same time. ' +
                'The most recently mounted root takes over and the previous one stops being controlled by the handle. ' +
                'A handle should be used by a single root that stays mounted for the lifetime of the handle.'
            )
          }
        })
      }
    }
    return () => {
      const index = this.attachedStores.lastIndexOf(newStore)
      if (index !== -1) {
        this.attachedStores.splice(index, 1)
      }
      this.setActiveStore(
        this.attachedStores[this.attachedStores.length - 1] ?? null
      )
    }
  }

  /**
   * Sets the store that currently controls the handle and notifies subscribers when it changes.
   *
   * @param store - Active store, or `null` when detached.
   */
  private setActiveStore(store: TStore | null): void {
    if (this.attachedStoreValue !== store) {
      this.attachedStoreValue = store
      this.storeListeners.forEach(listener => {
        listener()
      })
    }
  }

  /**
   * Opens the attached root's store and associates it with the trigger with the given id.
   *
   * @param triggerId - ID of the trigger to associate, or `null`/`undefined` to open unassociated.
   */
  protected openByTrigger(triggerId: string | null | undefined): void {
    const attachedStore = this.attachedStore
    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Base UI: ${this.componentName}Handle.open() was called while no root using this handle is mounted. ` +
            'The call was ignored; mount a root with this handle before opening it imperatively.'
        )
      }
      return
    }

    let triggerElement: Element | undefined
    if (triggerId) {
      for (
        let i = this.attachedStores.length - 1;
        i >= 0 && !triggerElement;
        i -= 1
      ) {
        triggerElement = this.attachedStores[i]?.context.triggerElements.getById(
          triggerId
        )
      }
      triggerElement ??=
        this.fallbackStore.context.triggerElements.getById(triggerId)
    }
    if (triggerId && !triggerElement) {
      if (this.throwOnMissingTrigger) {
        throw new Error(
          `Base UI: ${this.componentName}Handle.open() was called with the trigger id "${triggerId}", ` +
            'but no matching trigger is registered with this handle. ' +
            'An anchored popup cannot open without a trigger to anchor to. ' +
            `Pass the id of a mounted ${this.componentName}.Trigger that has this handle set on its "handle" prop.`
        )
      }
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Base UI: ${this.componentName}Handle.open: No trigger found with id "${triggerId}". ` +
            'The popup will open, but the trigger will not be associated with it.'
        )
      }
    }
    attachedStore.setOpen(
      true,
      createChangeEventDetails(
        REASONS.imperativeAction,
        undefined,
        triggerElement
      )
    )
  }

  /**
   * Closes the popup by setting the attached root's store to closed.
   */
  protected closePopup(): void {
    const attachedStore = this.attachedStore
    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Base UI: ${this.componentName}Handle.close() was called while no root using this handle is mounted. ` +
            'The call was ignored.'
        )
      }
      return
    }
    attachedStore.setOpen(
      false,
      createChangeEventDetails(REASONS.imperativeAction)
    )
  }
}
/**
 * Minimal store contract exposed by popup handles to detached triggers.
 *
 * Detached triggers read `store` during render and subscribe to be notified when the handle switches
 * between its fallback store and a root's live store.
 *
 * @typeParam THandleStore - Store shape exposed to detached triggers.
 */
export interface PopupHandleStoreProvider<THandleStore> {
  /**
   * Store currently exposed by the handle.
   */
  readonly store: THandleStore
  /**
   * Stable fallback store used for server rendering / hydration.
   */
  readonly serverStore: THandleStore
  /**
   * Subscribes to changes of the exposed store pointer.
   *
   * @param listener - Callback fired when the handle starts or stops pointing at a root store.
   * @returns Cleanup function that removes the listener.
   */
  subscribeStore: (listener: () => void) => () => void
}
/**
 * Store shape holding a trigger registry, required by `BasePopupHandle.openByTrigger` to resolve a
 * trigger element by id on both the attached root's store and the fallback store.
 */
export interface PopupHandleStoreWithTriggers {
  readonly context: {
    readonly triggerElements: PopupTriggerMap
  }
}
/**
 * Store shape required by `BasePopupHandle.openByTrigger`/`closePopup` to drive open/close state.
 * Only the root-owned `Store` needs this — the `HandleStore` view exposed to detached triggers may
 * omit `setOpen` entirely (as Dialog and PreviewCard's do) since it is never called while detached.
 */
export interface PopupHandleStoreWithOpen extends PopupHandleStoreWithTriggers {
  setOpen: (
    open: boolean,
    eventDetails: BaseUIChangeEventDetails<typeof REASONS.imperativeAction>
  ) => void
}
