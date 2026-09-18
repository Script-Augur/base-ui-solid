import { PopupTriggerMap } from './popupTriggerMap'
import { SolidStore } from './reactiveStore'

import type { TransitionStatus } from '../createTransitionStatus'
import type { HTMLProps } from '../labelable-provider'

const floatingRootSelectors = {
  open: (state: FloatingRootState) => state.open,
  transitionStatus: (state: FloatingRootState) => state.transitionStatus,
  domReferenceElement: (state: FloatingRootState) => state.domReferenceElement,
  referenceElement: (state: FloatingRootState) =>
    state.positionReference ?? state.referenceElement,
  floatingElement: (state: FloatingRootState) => state.floatingElement,
  floatingId: (state: FloatingRootState) => state.floatingId,
}
/**
 * Minimal event emitter matching upstream floating-ui `createEventEmitter`.
 */
export function createEventEmitter(): PopupEventEmitter {
  const map = new Map<string, Set<(data: unknown) => void>>()
  return {
    emit(event, data) {
      map.get(event)?.forEach(listener => listener(data))
    },
    on(event, listener) {
      if (!map.has(event)) {
        map.set(event, new Set())
      }
      map.get(event)!.add(listener)
    },
    off(event, listener) {
      map.get(event)?.delete(listener)
    },
  }
}
/**
 * Backing store for nested floating nodes (Menu subtree).
 * Solid counterpart to upstream `FloatingTreeStore`.
 */
export class FloatingTreeStore {
  nodesRef: { current: Array<FloatingTreeNode> } = { current: [] }
  events = createEventEmitter()

  /**
   * Registers a floating node.
   *
   * @param node - Node to add.
   */
  addNode(node: FloatingTreeNode): void {
    this.nodesRef.current.push(node)
  }

  /**
   * Removes a floating node.
   *
   * @param node - Node to remove.
   */
  removeNode(node: FloatingTreeNode): void {
    const index = this.nodesRef.current.findIndex(n => n === node)
    if (index !== -1) {
      this.nodesRef.current.splice(index, 1)
    }
  }
}
/**
 * Solid counterpart to upstream `FloatingRootStore`.
 * Provides `events` (`setOpen` / `openchange`) and `dispatchOpenChange`.
 */
export class FloatingRootStore extends SolidStore<
  FloatingRootState,
  FloatingRootContext,
  typeof floatingRootSelectors
> {
  /** When true, `setOpen` only forwards to `onOpenChange` (Menu sync path). */
  syncOnly: boolean

  /**
   * @param options - Initial floating root options.
   */
  constructor(options: CreateFloatingRootStoreOptions) {
    const {
      syncOnly = false,
      nested = false,
      onOpenChange,
      triggerElements,
      ...initialState
    } = options
    super(
      {
        open: initialState.open ?? false,
        transitionStatus: initialState.transitionStatus,
        floatingElement: initialState.floatingElement ?? null,
        referenceElement: initialState.referenceElement ?? null,
        positionReference: initialState.referenceElement ?? null,
        domReferenceElement: initialState.referenceElement ?? null,
        floatingId: initialState.floatingId,
      },
      {
        onOpenChange,
        dataRef: { current: {} },
        events: createEventEmitter(),
        nested,
        triggerElements,
      },
      floatingRootSelectors
    )
    this.syncOnly = syncOnly
  }

  /**
   * Syncs the event used by hover logic to distinguish hover-open from click.
   *
   * @param newOpen - Next open value.
   * @param event - Native event, if any.
   */
  syncOpenEvent = (newOpen: boolean, event: Event | undefined): void => {
    const isClickLike =
      event != null &&
      (event.type === 'click' ||
        event.type === 'mousedown' ||
        event.type === 'pointerdown' ||
        event.type === 'keydown')
    if (
      !newOpen ||
      !this.state.open ||
      (event != null && isClickLike)
    ) {
      this.context.dataRef.current.openEvent = newOpen ? event : undefined
    }
  }

  /**
   * Emits `openchange` for floating interactions.
   *
   * @param newOpen - Next open value.
   * @param eventDetails - Change event details (`reason`, `event`, `trigger`).
   */
  dispatchOpenChange = (
    newOpen: boolean,
    eventDetails: FloatingOpenChangeDetails
  ): void => {
    this.syncOpenEvent(newOpen, eventDetails.event)
    this.context.events.emit('openchange', {
      open: newOpen,
      reason: eventDetails.reason,
      nativeEvent: eventDetails.event,
      nested: this.context.nested,
      triggerElement: eventDetails.trigger,
    })
  }

  /**
   * Opens/closes via floating root (sync-only forwards to `onOpenChange`).
   *
   * @param newOpen - Next open value.
   * @param eventDetails - Change event details.
   */
  setOpen = (
    newOpen: boolean,
    eventDetails: FloatingOpenChangeDetails
  ): void => {
    if (this.syncOnly) {
      this.context.onOpenChange?.(newOpen, eventDetails)
      return
    }
    this.dispatchOpenChange(newOpen, eventDetails)
    this.context.onOpenChange?.(newOpen, eventDetails)
  }
}
/**
 * Creates a floating root for a popup store (Menu). Dialog/Popover leave the
 * shared `floatingRootContext` slot `null` until they adopt this path.
 *
 * @param triggerElements - Trigger registry shared with the popup store.
 * @param floatingId - Optional floating id.
 * @param nested - Whether this popup is nested under another floating node.
 * @returns A sync-only {@link FloatingRootStore}.
 */
export function createPopupFloatingRootContext(
  triggerElements: PopupTriggerMap,
  floatingId?: string,
  nested = false
): FloatingRootStore {
  return new FloatingRootStore({
    open: false,
    transitionStatus: undefined,
    floatingElement: null,
    referenceElement: null,
    triggerElements,
    floatingId,
    syncOnly: true,
    nested,
    onOpenChange: undefined,
  })
}
/**
 * Creates an inert empty floating root (MenuStore initial / NullStore).
 *
 * @returns A non-sync floating root with a fresh trigger map.
 */
export function getEmptyRootContext(): FloatingRootStore {
  return new FloatingRootStore({
    open: false,
    transitionStatus: undefined,
    floatingElement: null,
    referenceElement: null,
    triggerElements: new PopupTriggerMap(),
    floatingId: undefined,
    syncOnly: false,
    nested: false,
    onOpenChange: undefined,
  })
}
/**
 * Keeps a {@link FloatingRootStore} in sync with a popup store and returns it.
 * Solid counterpart to upstream `useSyncedFloatingRootContext`.
 *
 * @param options - Sync options.
 * @returns The floating root store (created once when not provided).
 */
export function createSyncedFloatingRootContext(options: {
  floatingRootContext?: FloatingRootStore
  floatingId?: string
  nested?: boolean
  onOpenChange?: (open: boolean, eventDetails: FloatingOpenChangeDetails) => void
  getOpen: () => boolean
  getReferenceElement: () => Element | null
  getFloatingElement: () => HTMLElement | null
  triggerElements: PopupTriggerMap
}): FloatingRootStore {
  const store =
    options.floatingRootContext ??
    new FloatingRootStore({
      open: options.getOpen(),
      transitionStatus: undefined,
      referenceElement: options.getReferenceElement(),
      floatingElement: options.getFloatingElement(),
      triggerElements: options.triggerElements,
      onOpenChange: options.onOpenChange,
      floatingId: options.floatingId,
      syncOnly: true,
      nested: options.nested ?? false,
    })

  store.context.onOpenChange = options.onOpenChange
  store.context.nested = options.nested ?? false

  const referenceElement = options.getReferenceElement()
  const floatingElement = options.getFloatingElement()
  const valuesToSync: Partial<FloatingRootState> = {
    open: options.getOpen(),
    floatingId: options.floatingId,
    referenceElement,
    floatingElement,
  }
  if (referenceElement instanceof Element) {
    valuesToSync.domReferenceElement = referenceElement
  }
  if (store.state.positionReference === store.state.referenceElement) {
    valuesToSync.positionReference = referenceElement
  }
  store.update(valuesToSync)

  return store
}
/** Event emitter shape used by floating root / tree. */
export type PopupEventEmitter = {
  emit: (event: string, data: unknown) => void
  on: (event: string, listener: (data: unknown) => void) => void
  off: (event: string, listener: (data: unknown) => void) => void
}
/** Node registered in a {@link FloatingTreeStore}. */
export type FloatingTreeNode = {
  id: string | undefined
  parentId: string | null
  context?: { open?: boolean }
}
/** Details passed through floating open-change dispatch. */
export type FloatingOpenChangeDetails = {
  reason?: string | null
  event?: Event
  trigger?: Element
  [key: string]: unknown
}
/** Re-export placeholder so consumers can type popup props bags. */
export type FloatingInteractionProps = HTMLProps
type FloatingRootState = {
  open: boolean
  transitionStatus: TransitionStatus
  floatingElement: HTMLElement | null
  referenceElement: Element | null
  positionReference: Element | null
  domReferenceElement: Element | null
  floatingId: string | undefined
}
type FloatingRootContext = {
  onOpenChange?:
    | ((open: boolean, eventDetails: FloatingOpenChangeDetails) => void)
    | undefined
  dataRef: { current: { openEvent?: Event; [key: string]: unknown } }
  events: PopupEventEmitter
  nested: boolean
  triggerElements: PopupTriggerMap
}
type CreateFloatingRootStoreOptions = {
  open?: boolean
  transitionStatus?: TransitionStatus
  floatingElement?: HTMLElement | null
  referenceElement?: Element | null
  triggerElements: PopupTriggerMap
  floatingId?: string
  syncOnly?: boolean
  nested?: boolean
  onOpenChange?:
    | ((open: boolean, eventDetails: FloatingOpenChangeDetails) => void)
    | undefined
}
