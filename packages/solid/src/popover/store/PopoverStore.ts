import { REASONS } from '../../internals/createChangeEventDetails'
import { NOOP } from '../../internals/noop'
import {
  NullStore,
  PopupTriggerMap,
  SolidStore,
  attachPreventUnmountOnClose,
  createInitialPopupStoreState,
  popupStoreSelectors,
  setPopupOpenState,
} from '../../internals/popups'
import { PATIENT_CLICK_THRESHOLD } from '../utils/constants'

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
  instantType: (state: PopoverStoreState) => state.instantType,
  openMethod: (state: PopoverStoreState) => state.openMethod,
  openChangeReason: (state: PopoverStoreState) => state.openChangeReason,
  modal: (state: PopoverStoreState) => state.modal,
  stickIfOpen: (state: PopoverStoreState) => state.stickIfOpen,
  titleElementId: (state: PopoverStoreState) => state.titleElementId,
  descriptionElementId: (state: PopoverStoreState) =>
    state.descriptionElementId,
  openOnHover: (state: PopoverStoreState) => state.openOnHover,
  closeDelay: (state: PopoverStoreState) => state.closeDelay,
}
/**
 * Reactive store owned by a Popover root.
 *
 * @typeParam TPayload - Optional payload type.
 */
export class PopoverStore<TPayload = unknown> extends SolidStore<
  PopoverStoreState<TPayload>,
  PopupStoreContext<PopoverChangeEventDetails>,
  typeof selectors
> {
  private stickIfOpenTimeout: ReturnType<typeof setTimeout> | undefined

  /**
   * @param initialState - Partial initial state overrides.
   */
  constructor(initialState?: Partial<PopoverStoreState<TPayload>>) {
    const triggerElements = new PopupTriggerMap()
    super(
      createInitialPopoverState(initialState),
      createInitialPopoverContext(triggerElements),
      selectors
    )
  }

  /**
   * Opens or closes the popover.
   *
   * @param nextOpen - Next open value.
   * @param eventDetails - Change event details.
   */
  setOpen = (
    nextOpen: boolean,
    eventDetails: PopoverChangeEventDetails
  ): void => {
    const isHover = eventDetails.reason === REASONS.triggerHover
    const isKeyboardClick =
      eventDetails.reason === REASONS.triggerPress &&
      eventDetails.event instanceof MouseEvent &&
      eventDetails.event.detail === 0
    const isDismissClose =
      !nextOpen &&
      (eventDetails.reason === REASONS.escapeKey ||
        eventDetails.reason === REASONS.none)
    const shouldPreventUnmountOnClose = attachPreventUnmountOnClose(
      eventDetails as { preventUnmountOnClose: () => void }
    )
    const activeTriggerId = this.select('activeTriggerId')
    if (
      !nextOpen &&
      eventDetails.reason === REASONS.closePress &&
      eventDetails.trigger == null &&
      activeTriggerId != null
    ) {
      eventDetails.trigger =
        this.context.triggerElements.getById(activeTriggerId) ??
        this.select('activeTriggerElement') ??
        undefined
    }
    this.context.onOpenChange?.(nextOpen, eventDetails)
    if (eventDetails.isCanceled) {
      return
    }

    const changeState = () => {
      const updatedState: Partial<PopoverStoreState<TPayload>> = {
        open: nextOpen,
        openChangeReason: eventDetails.reason,
      }
      setPopupOpenState(
        updatedState,
        nextOpen,
        eventDetails.trigger,
        shouldPreventUnmountOnClose()
      )
      this.update(updatedState)
    }

    if (isHover && nextOpen) {
      this.set('stickIfOpen', true)
      if (this.stickIfOpenTimeout) clearTimeout(this.stickIfOpenTimeout)
      this.stickIfOpenTimeout = setTimeout(() => {
        this.set('stickIfOpen', false)
      }, PATIENT_CLICK_THRESHOLD)
    }

    changeState()

    let instantType: string | undefined
    if (isKeyboardClick) {
      instantType = 'click'
    } else if (isDismissClose) {
      instantType = 'dismiss'
    } else if (eventDetails.reason === REASONS.focusOut) {
      instantType = 'focus'
    }
    this.set('instantType', instantType)
  }

  /** Clears patient-click timeout on dispose. */
  dispose(): void {
    if (this.stickIfOpenTimeout) {
      clearTimeout(this.stickIfOpenTimeout)
      this.stickIfOpenTimeout = undefined
    }
  }
}
/**
 * Creates the inert fallback store used by detached handle-backed triggers.
 *
 * @typeParam TPayload - Payload type.
 * @returns Inert popover handle store (`setOpen` is a no-op).
 */
export function createNullPopoverStore<
  TPayload = unknown,
>(): PopoverHandleStore<TPayload> {
  const triggerElements = new PopupTriggerMap()
  const store = new NullStore(
    Object.freeze(createInitialPopoverState<TPayload>()),
    Object.freeze(createInitialPopoverContext(triggerElements)),
    selectors
  )
  return Object.assign(store, {
    setOpen: NOOP,
  })
}
/**
 * Popover-specific store state on top of shared popup store state.
 *
 * @typeParam TPayload - Optional payload from triggers.
 */
export type PopoverStoreState<TPayload = unknown> =
  PopupStoreState<TPayload> & {
    modal: boolean | 'trap-focus'
    openMethod: string | null
    openChangeReason: ChangeEventReason | null
    instantType: string | undefined
    stickIfOpen: boolean
    titleElementId: string | undefined
    descriptionElementId: string | undefined
    openOnHover: boolean
    closeDelay: number
  }
/**
 * Store view that detached handle-backed triggers read from.
 *
 * @typeParam TPayload - Payload type.
 */
export type PopoverHandleStore<TPayload = unknown> = Pick<
  PopoverStore<TPayload>,
  PopupTriggerStoreKeys | 'setOpen'
>
function createInitialPopoverState<TPayload>(
  initialState?: Partial<PopoverStoreState<TPayload>>
): PopoverStoreState<TPayload> {
  return {
    ...createInitialPopupStoreState<TPayload>(),
    modal: false,
    openMethod: null,
    openChangeReason: null,
    instantType: undefined,
    stickIfOpen: true,
    titleElementId: undefined,
    descriptionElementId: undefined,
    openOnHover: false,
    closeDelay: 0,
    ...initialState,
  }
}
function createInitialPopoverContext(
  triggerElements: PopupTriggerMap
): PopupStoreContext<PopoverChangeEventDetails> {
  return {
    popupRef: { current: null },
    triggerElements,
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
  }
}
type PopoverChangeEventDetails =
  BaseUIChangeEventDetails<ChangeEventReason> & {
    preventUnmountOnClose?: () => void
  }
