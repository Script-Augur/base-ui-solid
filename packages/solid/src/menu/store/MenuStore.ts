import { NOOP } from '../../internals/noop'
import {
  EMPTY_OBJECT,
  FloatingTreeStore,
  NullStore,
  PopupTriggerMap,
  SolidStore,
  createInitialPopupStoreState,
  getEmptyRootContext,
  popupStoreSelectors,
} from '../../internals/popups'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { HTMLProps } from '../../internals/labelable-provider'
import type {
  FloatingOpenChangeDetails,
  PopupStoreContext,
  PopupStoreState,
  PopupTriggerStoreKeys,
} from '../../internals/popups'
import type { MenuParent } from '../utils/types'

const selectors = {
  ...popupStoreSelectors,
  disabled: (state: MenuStoreState) =>
    state.parent.type === 'menubar'
      ? Boolean(
          (state.parent.context as { disabled?: boolean }).disabled ||
            state.disabled
        )
      : state.disabled,
  modal: (state: MenuStoreState) =>
    (state.parent.type === undefined || state.parent.type === 'context-menu') &&
    state.modal,
  openMethod: (state: MenuStoreState) => state.openMethod,
  allowMouseEnter: (state: MenuStoreState) => state.allowMouseEnter,
  highlightItemOnHover: (state: MenuStoreState) => state.highlightItemOnHover,
  parent: (state: MenuStoreState) => state.parent,
  rootId: (state: MenuStoreState): string | undefined => {
    if (state.parent.type === 'menu') {
      return state.parent.store.select('rootId')
    }
    return state.parent.type !== undefined
      ? (state.parent.context as { rootId?: string }).rootId
      : state.rootId
  },
  activeIndex: (state: MenuStoreState) => state.activeIndex,
  isActive: (state: MenuStoreState, itemIndex: number) =>
    state.activeIndex === itemIndex,
  hoverEnabled: (state: MenuStoreState) => state.hoverEnabled,
  instantType: (state: MenuStoreState) => state.instantType,
  lastOpenChangeReason: (state: MenuStoreState) => state.openChangeReason,
  floatingTreeRoot: (state: MenuStoreState): FloatingTreeStore => {
    if (state.parent.type === 'menu') {
      return state.parent.store.select('floatingTreeRoot')
    }
    return state.floatingTreeRoot
  },
  floatingNodeId: (state: MenuStoreState) => state.floatingNodeId,
  floatingParentNodeId: (state: MenuStoreState) => state.floatingParentNodeId,
  itemProps: (state: MenuStoreState) => state.itemProps,
  closeDelay: (state: MenuStoreState) => state.closeDelay,
  adaptiveOrigin: (state: MenuStoreState) => state.adaptiveOrigin,
  keyboardEventRelay: (
    state: MenuStoreState
  ): ((event: KeyboardEvent) => void) | undefined => {
    if (state.keyboardEventRelay) {
      return state.keyboardEventRelay
    }
    if (state.parent.type === 'menu') {
      return state.parent.store.select('keyboardEventRelay')
    }
    return undefined
  },
}

/**
 * Reactive store owned by a Menu root (store-first open pipeline).
 *
 * @typeParam TPayload - Optional payload type.
 */
export class MenuStore<TPayload = unknown> extends SolidStore<
  MenuStoreState<TPayload>,
  MenuStoreContext,
  typeof selectors
> {
  private unsubscribeParentListener: (() => void) | null = null

  /**
   * @param initialState - Partial initial state overrides.
   */
  constructor(initialState?: Partial<MenuStoreState<TPayload>>) {
    const triggerElements = new PopupTriggerMap()
    super(
      createInitialMenuState(initialState),
      createInitialMenuContext(triggerElements),
      selectors
    )

    this.unsubscribeParentListener = this.observe('parent', parent => {
      this.unsubscribeParentListener?.()
      const typedParent = parent as MenuParent
      if (typedParent.type === 'menu') {
        let rootId = typedParent.store.select('rootId')
        let floatingTreeRoot = typedParent.store.select('floatingTreeRoot')
        let keyboardEventRelay = typedParent.store.select('keyboardEventRelay')
        this.unsubscribeParentListener = typedParent.store.subscribe(() => {
          const nextRootId = typedParent.store.select('rootId')
          const nextFloatingTreeRoot =
            typedParent.store.select('floatingTreeRoot')
          const nextKeyboardEventRelay =
            typedParent.store.select('keyboardEventRelay')
          if (
            rootId === nextRootId &&
            floatingTreeRoot === nextFloatingTreeRoot &&
            keyboardEventRelay === nextKeyboardEventRelay
          ) {
            return
          }
          rootId = nextRootId
          floatingTreeRoot = nextFloatingTreeRoot
          keyboardEventRelay = nextKeyboardEventRelay
          this.notifyAll()
        })
        this.context.allowMouseUpTriggerRef =
          typedParent.store.context.allowMouseUpTriggerRef
        return
      }
      if (typedParent.type !== undefined) {
        this.context.allowMouseUpTriggerRef = (
          typedParent.context as {
            allowMouseUpTriggerRef: { current: boolean }
          }
        ).allowMouseUpTriggerRef
      }
      this.unsubscribeParentListener = null
    })
  }

  /**
   * Emits open change through the floating root event bus.
   * MenuRoot listens and applies the real open pipeline (`OPEN_PIPELINE.md`).
   *
   * @param open - Next open value.
   * @param eventDetails - Change event details.
   */
  setOpen = (
    open: boolean,
    eventDetails: Omit<MenuChangeEventDetails, 'preventUnmountOnClose'>
  ): void => {
    const floating = this.state.floatingRootContext
    floating?.context.events.emit('setOpen', {
      open,
      eventDetails,
    } satisfies { open: boolean; eventDetails: FloatingOpenChangeDetails })
  }

  /** Clears parent observe subscription. */
  dispose(): void {
    this.unsubscribeParentListener?.()
    this.unsubscribeParentListener = null
  }
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers.
 *
 * @typeParam TPayload - Payload type.
 * @returns Inert menu handle store (`setOpen` is a no-op).
 */
export function createNullMenuStore<
  TPayload = unknown,
>(): MenuHandleStore<TPayload> {
  const triggerElements = new PopupTriggerMap()
  const store = new NullStore(
    Object.freeze(createInitialMenuState<TPayload>()),
    Object.freeze(createInitialMenuContext(triggerElements)),
    selectors
  )
  return Object.assign(store, {
    setOpen: NOOP,
  })
}

/**
 * Menu-specific store state on top of shared popup store state.
 *
 * @typeParam TPayload - Optional payload from triggers.
 */
export type MenuStoreState<TPayload = unknown> = PopupStoreState<TPayload> & {
  disabled: boolean
  modal: boolean
  openMethod: string | null
  allowMouseEnter: boolean
  highlightItemOnHover: boolean
  parent: MenuParent
  rootId: string | undefined
  activeIndex: number | null
  hoverEnabled: boolean
  instantType: 'dismiss' | 'click' | 'group' | 'trigger-change' | undefined
  openChangeReason: ChangeEventReason | null
  floatingTreeRoot: FloatingTreeStore
  floatingNodeId: string | undefined
  floatingParentNodeId: string | null
  itemProps: HTMLProps
  closeDelay: number
  keyboardEventRelay: ((event: KeyboardEvent) => void) | undefined
  adaptiveOrigin: unknown
}

/**
 * Store view that detached handle-backed triggers read from.
 *
 * @typeParam TPayload - Payload type.
 */
export type MenuHandleStore<TPayload = unknown> = Pick<
  MenuStore<TPayload>,
  PopupTriggerStoreKeys | 'setOpen'
>

/**
 * Menu store context (refs + trigger map).
 */
export type MenuStoreContext = PopupStoreContext<MenuChangeEventDetails> & {
  readonly positionerRef: { current: HTMLElement | null }
  readonly popupRef: { current: HTMLElement | null }
  readonly typingRef: { current: boolean }
  readonly itemDomElements: { current: Array<HTMLElement | null> }
  readonly itemLabels: { current: Array<string | null> }
  allowMouseUpTriggerRef: { current: boolean }
  readonly triggerFocusTargetRef: { current: HTMLElement | null }
  readonly beforeContentFocusGuardRef: { current: HTMLElement | null }
}

function createInitialMenuState<TPayload>(
  initialState?: Partial<MenuStoreState<TPayload>>
): MenuStoreState<TPayload> {
  return {
    ...createInitialPopupStoreState<TPayload>(),
    floatingRootContext: getEmptyRootContext(),
    disabled: false,
    modal: true,
    openMethod: null,
    allowMouseEnter: false,
    highlightItemOnHover: true,
    parent: { type: undefined },
    rootId: undefined,
    activeIndex: null,
    hoverEnabled: true,
    instantType: undefined,
    openChangeReason: null,
    floatingTreeRoot: new FloatingTreeStore(),
    floatingNodeId: undefined,
    floatingParentNodeId: null,
    itemProps: EMPTY_OBJECT,
    keyboardEventRelay: undefined,
    closeDelay: 0,
    adaptiveOrigin: undefined,
    ...initialState,
  }
}

function createInitialMenuContext(
  triggerElements: PopupTriggerMap
): MenuStoreContext {
  return {
    positionerRef: { current: null },
    popupRef: { current: null },
    typingRef: { current: false },
    itemDomElements: { current: [] },
    itemLabels: { current: [] },
    allowMouseUpTriggerRef: { current: false },
    triggerFocusTargetRef: { current: null },
    beforeContentFocusGuardRef: { current: null },
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    triggerElements,
  }
}

type MenuChangeEventDetails = BaseUIChangeEventDetails<ChangeEventReason> & {
  preventUnmountOnClose?: () => void
}
