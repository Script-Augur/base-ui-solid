import type { TransitionStatus } from '../createTransitionStatus'
import type { HTMLProps } from '../labelable-provider'
import type { FloatingRootStore } from './floatingRoot'
import type { PopupTriggerMap } from './popupTriggerMap'
import type { SolidStore } from './reactiveStore'

const activeTriggerIdSelector = (state: S) =>
  state.triggerIdProp ?? state.activeTriggerId
const openSelector = (state: S) => state.openProp ?? state.open
const popupIdSelector = (state: S) => {
  const popupId = state.popupElement?.id
  return popupId || undefined
}
/**
 * Empty object used as default trigger/popup props (stable reference).
 */
export const EMPTY_OBJECT: HTMLProps = Object.freeze({})
/**
 * Shared selectors for popup store state.
 */
export const popupStoreSelectors = {
  open: openSelector,
  mounted: (state: S) => state.mounted,
  transitionStatus: (state: S) => state.transitionStatus,
  floatingRootContext: (state: S) => state.floatingRootContext,
  floatingId: (state: S) => state.floatingId,
  triggerCount: (state: S) => state.triggerCount,
  preventUnmountingOnClose: (state: S) => state.preventUnmountingOnClose,
  payload: (state: S) => state.payload,
  activeTriggerId: activeTriggerIdSelector,
  activeTriggerElement: (state: S) =>
    state.mounted ? state.activeTriggerElement : null,
  popupId: popupIdSelector,
  /**
   * Whether the trigger with the given ID was used to open the popup.
   */
  isTriggerActive: (state: S, triggerId: string | undefined) =>
    triggerId !== undefined && activeTriggerIdSelector(state) === triggerId,
  /**
   * Whether the popup is open and was activated by a trigger with the given ID.
   */
  isOpenedByTrigger: (state: S, triggerId: string | undefined) =>
    triggerOwnsOpenPopup(state, triggerId),
  /**
   * Whether the popup is mounted and was activated by a trigger with the given ID.
   */
  isMountedByTrigger: (state: S, triggerId: string | undefined) =>
    triggerId !== undefined &&
    activeTriggerIdSelector(state) === triggerId &&
    state.mounted,
  triggerProps: (state: S, isActive: boolean) =>
    isActive ? state.activeTriggerProps : state.inactiveTriggerProps,
  /**
   * Popup id for the trigger that currently owns the open popup.
   */
  triggerPopupId: (state: S, triggerId: string | undefined) =>
    triggerOwnsOpenPopupOrIsOnlyTrigger(state, triggerId)
      ? popupIdSelector(state)
      : undefined,
  popupProps: (state: S) => state.popupProps,
  popupElement: (state: S) => state.popupElement,
  positionerElement: (state: S) => state.positionerElement,
}
/**
 * Creates the default initial state shared by popup stores.
 *
 * @typeParam TPayload - Optional trigger payload type.
 * @returns Fresh {@link PopupStoreState}.
 */
export function createInitialPopupStoreState<
  TPayload = unknown,
>(): PopupStoreState<TPayload> {
  return {
    open: false,
    openProp: undefined,
    mounted: false,
    transitionStatus: undefined,
    floatingRootContext: null,
    floatingId: undefined,
    triggerCount: 0,
    preventUnmountingOnClose: false,
    payload: undefined,
    activeTriggerId: null,
    activeTriggerElement: null,
    triggerIdProp: undefined,
    popupElement: null,
    positionerElement: null,
    activeTriggerProps: EMPTY_OBJECT,
    inactiveTriggerProps: EMPTY_OBJECT,
    popupProps: EMPTY_OBJECT,
  }
}
/**
 * State common to all popup stores.
 *
 * @typeParam TPayload - Optional trigger payload type.
 */
export type PopupStoreState<TPayload = unknown> = {
  /**
   * Whether the popup is open (internal state).
   */
  open: boolean
  /**
   * Whether the popup is open (external prop).
   */
  readonly openProp: boolean | undefined
  /**
   * Whether the popup should be mounted in the DOM.
   * This usually follows `open` but can be different during exit transitions.
   */
  mounted: boolean
  /**
   * The current enter/exit transition status of the popup.
   */
  transitionStatus: TransitionStatus
  /**
   * Floating-ui root context used by Menu (and eventually shared open dispatch).
   * Dialog/Popover Roots leave this `null` until floating event dispatch is wired;
   * see `MENU_GAPS.md` in this folder.
   */
  floatingRootContext: PopupFloatingRootContext | null
  /**
   * Stable floating id (upstream `useId()`). Optional until Menu/floating land.
   */
  floatingId: string | undefined
  /**
   * Number of trigger elements currently registered for this popup.
   */
  triggerCount: number
  /**
   * Whether to prevent unmounting the popup when closed.
   * Useful for interacting with JS animation libraries that control unmounting themselves.
   */
  preventUnmountingOnClose: boolean
  /**
   * Optional payload set by the trigger.
   */
  payload: TPayload | undefined
  /**
   * ID of the currently active trigger.
   */
  activeTriggerId: string | null
  /**
   * The currently active trigger DOM element.
   */
  activeTriggerElement: Element | null
  /**
   * ID of the trigger (external prop).
   */
  readonly triggerIdProp: string | null | undefined
  /**
   * The popup DOM element.
   */
  popupElement: HTMLElement | null
  /**
   * The positioner DOM element.
   */
  positionerElement: HTMLElement | null
  /**
   * Props to spread onto the active trigger element.
   */
  activeTriggerProps: HTMLProps
  /**
   * Props to spread onto inactive trigger elements.
   */
  inactiveTriggerProps: HTMLProps
  /**
   * Props to spread onto the popup element.
   */
  popupProps: HTMLProps
}

/**
 * Typed slot for upstream `FloatingRootContext` / `FloatingRootStore`.
 * Menu fills this with a real {@link FloatingRootStore}; Dialog/Popover keep `null`.
 */
export type PopupFloatingRootContext = FloatingRootStore | null
/**
 * Non-reactive context common to popup stores.
 *
 * @typeParam TChangeEventDetails - Open-change event details type.
 */
export type PopupStoreContext<TChangeEventDetails> = {
  /**
   * Map of registered trigger elements.
   */
  readonly triggerElements: PopupTriggerMap
  /**
   * Reference holder for the popup element (Solid uses assign callbacks elsewhere;
   * kept for API parity with upstream).
   */
  readonly popupRef: { current: HTMLElement | null }
  /**
   * Callback fired when the open state changes.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: TChangeEventDetails) => void)
    | undefined
  /**
   * Callback fired when the open state change animation completes.
   */
  onOpenChangeComplete: ((open: boolean) => void) | undefined
}
export type PopupStoreSelectors = typeof popupStoreSelectors
/**
 * Store members a detached handle-backed trigger reads or invokes for trigger registration and data
 * forwarding.
 */
export type PopupTriggerStoreKeys =
  | 'context'
  | 'select'
  | 'set'
  | 'state'
  | 'update'
  | 'useState'
/**
 * The subset of a popup store that trigger registration and data forwarding rely on.
 *
 * @typeParam TState - Popup store state.
 */
export type PopupTriggerDataStore<TState extends PopupStoreState<unknown>> =
  Pick<
    SolidStore<
      Readonly<TState>,
      PopupStoreContext<never>,
      PopupStoreSelectors
    >,
    PopupTriggerStoreKeys
  >
function triggerOwnsOpenPopup(state: S, triggerId: string | undefined) {
  return (
    triggerId !== undefined &&
    openSelector(state) &&
    activeTriggerIdSelector(state) === triggerId
  )
}
function triggerOwnsOpenPopupOrIsOnlyTrigger(
  state: S,
  triggerId: string | undefined
) {
  if (triggerOwnsOpenPopup(state, triggerId)) {
    return true
  }
  return (
    triggerId !== undefined &&
    openSelector(state) &&
    activeTriggerIdSelector(state) == null &&
    state.triggerCount === 1
  )
}
type S = PopupStoreState<unknown>
