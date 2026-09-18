import {
  NullStore,
  PopupTriggerMap,
  SolidStore,
  createInitialPopupStoreState,
  popupStoreSelectors,
  setPopupOpenState,
} from '../../internals/popups'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type {
  PopupStoreContext,
  PopupStoreState,
  PopupTriggerStoreKeys,
} from '../../internals/popups'

const selectors = {
  ...popupStoreSelectors,
  modal: (state: DialogStoreState) => state.modal,
  nested: (state: DialogStoreState) => state.nested,
  nestedOpenDialogCount: (state: DialogStoreState) =>
    state.nestedOpenDialogCount,
  disablePointerDismissal: (state: DialogStoreState) =>
    state.disablePointerDismissal,
  openMethod: (state: DialogStoreState) => state.openMethod,
  descriptionElementId: (state: DialogStoreState) => state.descriptionElementId,
  titleElementId: (state: DialogStoreState) => state.titleElementId,
  viewportElement: (state: DialogStoreState) => state.viewportElement,
  role: (state: DialogStoreState) => state.role,
}
/**
 * Reactive store owned by a Dialog root (and inert fallbacks for handles).
 *
 * @typeParam TPayload - Optional payload type.
 */
export class DialogStore<TPayload = unknown> extends SolidStore<
  DialogStoreState<TPayload>,
  PopupStoreContext<DialogChangeEventDetails>,
  typeof selectors
> {
  /**
   * @param initialState - Partial initial state overrides.
   */
  constructor(initialState?: Partial<DialogStoreState<TPayload>>) {
    const triggerElements = new PopupTriggerMap()
    const state = createInitialDialogState(initialState)
    super(state, createInitialDialogContext(triggerElements), selectors)
  }

  /**
   * Opens or closes the dialog, notifying `onOpenChange` and updating trigger ownership.
   *
   * @param nextOpen - Next open value.
   * @param eventDetails - Change event details.
   */
  setOpen = (
    nextOpen: boolean,
    eventDetails: DialogChangeEventDetails
  ): void => {
    eventDetails.preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true)
    }
    if (
      !nextOpen &&
      eventDetails.trigger == null &&
      this.state.activeTriggerId != null
    ) {
      eventDetails.trigger = this.state.activeTriggerElement ?? undefined
    }
    this.context.onOpenChange?.(nextOpen, eventDetails)
    if (eventDetails.isCanceled) {
      return
    }
    const updatedState: Partial<DialogStoreState<TPayload>> = {
      open: nextOpen,
    }
    setPopupOpenState(updatedState, nextOpen, eventDetails.trigger)
    this.update(updatedState)
  }
}
/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `Dialog.Root` is attached.
 *
 * @typeParam TPayload - Payload type.
 * @returns Inert dialog store.
 */
export function createNullDialogStore<
  TPayload = unknown,
>(): DialogHandleStore<TPayload> {
  const triggerElements = new PopupTriggerMap()
  const store = new NullStore(
    Object.freeze(createInitialDialogState<TPayload>()),
    Object.freeze(createInitialDialogContext(triggerElements)),
    selectors
  )
  return Object.assign(store, {
    setOpen: () => {},
  })
}
/**
 * Dialog-specific store state on top of shared popup store state.
 *
 * @typeParam TPayload - Optional payload from triggers / `openWithPayload`.
 */
export type DialogStoreState<TPayload = unknown> = PopupStoreState<TPayload> & {
  modal: boolean | 'trap-focus'
  disablePointerDismissal: boolean
  nested: boolean
  nestedOpenDialogCount: number
  role: 'dialog' | 'alertdialog'
  descriptionElementId: string | undefined
  titleElementId: string | undefined
  viewportElement: HTMLElement | null
  openMethod: string | null
}
/**
 * The subset of `DialogStore` that detached handle-backed triggers rely on.
 *
 * @typeParam TPayload - Payload type.
 */
export type DialogHandleStore<TPayload = unknown> = Pick<
  DialogStore<TPayload>,
  PopupTriggerStoreKeys | 'setOpen'
>
function createInitialDialogState<TPayload>(
  initialState?: Partial<DialogStoreState<TPayload>>
): DialogStoreState<TPayload> {
  return {
    ...createInitialPopupStoreState<TPayload>(),
    modal: true,
    disablePointerDismissal: false,
    viewportElement: null,
    descriptionElementId: undefined,
    titleElementId: undefined,
    openMethod: null,
    nested: false,
    nestedOpenDialogCount: 0,
    role: 'dialog',
    ...initialState,
  }
}
function createInitialDialogContext(
  triggerElements: PopupTriggerMap
): PopupStoreContext<DialogChangeEventDetails> {
  return {
    popupRef: { current: null },
    triggerElements,
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
  }
}
type DialogChangeEventDetails = BaseUIChangeEventDetails<ChangeEventReason> & {
  preventUnmountOnClose?: () => void
}
