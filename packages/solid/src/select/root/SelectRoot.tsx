import {
  visuallyHidden,
  visuallyHiddenInput,
} from '@script-augur/base-ui-utils'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { createDismiss } from '../../internals/dismiss'
import { createRegisterFieldControl } from '../../internals/field-register-control/createRegisterFieldControl'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { createFocusTrap } from '../../internals/focusTrap'
import { useFormContext } from '../../internals/form-context/FormContext'
import { createScrollLock } from '../../internals/scrollLock'
import { defaultItemEquality } from '../utils/itemEquality'
import { stringifyAsValue } from '../utils/resolveValueLabel'

import { SelectRootContext } from './SelectRootContext'

import type { SelectRootContextValue } from './SelectRootContext'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { SelectItems } from '../utils/resolveValueLabel'
import type { JSX } from 'solid-js'
/**
 * Groups all parts of the select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Root props (`value`, `open`, `items`, …).
 * @returns A Solid JSX fragment wrapping children in context.
 *
 * @example
 * ```tsx
 * import { Select } from "@script-augur/base-ui-solid/select"
 *
 * <Select.Root>
 *   <Select.Trigger>
 *     <Select.Value placeholder="Choose one" />
 *   </Select.Trigger>
 *   <Select.Portal>
 *     <Select.Positioner>
 *       <Select.Popup>
 *         <Select.List>
 *           <Select.Item value="a">A</Select.Item>
 *         </Select.List>
 *       </Select.Popup>
 *     </Select.Positioner>
 *   </Select.Portal>
 * </Select.Root>
 * ```
 */
export function SelectRoot<TValue = unknown>(
  componentProps: SelectRootProps<TValue>
): JSX.Element {
  const [local] = splitProps(
    componentProps as SelectRootProps<unknown> & Record<string, unknown>,
    [
      'children',
      'id',
      'value',
      'defaultValue',
      'onValueChange',
      'open',
      'defaultOpen',
      'onOpenChange',
      'onOpenChangeComplete',
      'multiple',
      'modal',
      'disabled',
      'readOnly',
      'required',
      'name',
      'form',
      'autoComplete',
      'inputRef',
      'items',
      'itemToStringLabel',
      'itemToStringValue',
      'isItemEqualToValue',
      'highlightItemOnHover',
      'actionsRef',
    ]
  )

  const { clearErrors } = useFormContext()
  const field = useFieldRootContext()
  const [labelId, labelIdAssign] = createSignal<string | undefined>(undefined)

  const disabled = () => field.disabled() || Boolean(local.disabled)
  const readOnly = () => local.readOnly ?? false
  const required = () => local.required ?? false
  const multiple = () => local.multiple ?? false
  const modal = () => local.modal ?? true
  const name = () => field.name() ?? local.name
  const highlightItemOnHover = () => local.highlightItemOnHover ?? true

  const generatedId = createUniqueId()
  const id = () => local.id ?? generatedId

  const isItemEqualToValue = () =>
    local.isItemEqualToValue ?? defaultItemEquality

  const [value, valueAssign] = createControlled<unknown>({
    value: () => local.value,
    defaultValue: local.defaultValue ?? (multiple() ? [] : null),
  })

  const [open, openAssign] = createControlled({
    value: () => local.open,
    defaultValue: local.defaultOpen ?? false,
  })

  const { mounted, mountedAssign, transitionStatus } =
    createTransitionStatus(open)

  const [triggerElement, triggerElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [positionerElement, positionerElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [popupElement, popupElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [listElement, listElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [arrowElement, arrowElementAssign] = createSignal<HTMLElement | null>(
    null
  )
  const [backdropElement, backdropElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [internalBackdropElement, internalBackdropElementAssign] =
    createSignal<HTMLElement | null>(null)
  const [openChangeReason, openChangeReasonAssign] =
    createSignal<ChangeEventReason | null>(null)
  const [instantType, instantTypeAssign] = createSignal<string | undefined>()
  const [scrollUpVisible, scrollUpVisibleAssign] = createSignal(false)
  const [scrollDownVisible, scrollDownVisibleAssign] = createSignal(false)

  const portalId = `base-ui-select-portal-${generatedId}`

  const itemToStringValue = () => local.itemToStringValue
  const itemToStringLabel = () => local.itemToStringLabel

  const serializedValue = createMemo(() => {
    if (multiple()) return ''
    return stringifyAsValue(value(), itemToStringValue())
  })

  const hasSelectedValue = createMemo(() => {
    if (multiple()) {
      return Array.isArray(value()) && (value() as Array<unknown>).length > 0
    }
    return value() != null && serializedValue() !== ''
  })

  createEffect(() => {
    field.filledAssign(hasSelectedValue())
  })

  function isSelectedValueDirty(currentValue: unknown): boolean {
    const initialValue = field.validityData().initialValue
    return currentValue !== initialValue
  }

  createEffectOnValueChange(value, () => {
    clearErrors(name())
    field.dirtyAssign(isSelectedValueDirty(value()))
    field.validation.change(value())
  })

  const setOpen = (
    nextOpen: boolean,
    eventDetails: SelectRootChangeEventDetails
  ) => {
    local.onOpenChange?.(nextOpen, eventDetails)
    if (eventDetails.isCanceled) return

    const reason = eventDetails.reason
    openAssign(nextOpen)
    if (nextOpen) {
      openChangeReasonAssign(reason)
    }

    const isKeyboard =
      reason === REASONS.triggerPress &&
      eventDetails.event instanceof MouseEvent &&
      eventDetails.event.detail === 0
    const isDismissClose =
      !nextOpen && (reason === REASONS.escapeKey || reason === REASONS.none)
    instantTypeAssign(
      isKeyboard ? 'click' : isDismissClose ? 'dismiss' : undefined
    )

    if (
      !nextOpen &&
      (reason === REASONS.focusOut || reason === REASONS.outsidePress)
    ) {
      field.touchedAssign(true)
      field.focusedAssign(false)
      if (field.validationMode() === 'onBlur') {
        void field.validation.commit(value())
      }
    }
  }

  const handleUnmount = () => {
    mountedAssign(false)
    openChangeReasonAssign(null)
    local.onOpenChangeComplete?.(false)
  }

  createOpenChangeComplete({
    open,
    element: popupElement,
    onComplete() {
      if (!open()) {
        handleUnmount()
      } else {
        local.onOpenChangeComplete?.(true)
      }
    },
  })

  createEffect(() => {
    const actions = local.actionsRef
    if (!actions) return
    actions.unmount = handleUnmount
  })

  const setValue = (
    nextValue: unknown,
    eventDetails: SelectRootChangeEventDetails
  ) => {
    local.onValueChange?.(nextValue, eventDetails)
    if (eventDetails.isCanceled) return
    valueAssign(nextValue)
  }

  createScrollLock(() => open() && modal() === true && mounted())

  createFocusTrap({
    enabled: () => open() && mounted(),
    container: popupElement,
    initialFocus: () => {
      const popup = popupElement()
      if (!popup) return undefined
      const selected = popup.querySelector<HTMLElement>(
        '[role="option"][aria-selected="true"]'
      )
      return selected ?? popup.querySelector<HTMLElement>('[role="option"]')
    },
    restoreFocus: () => triggerElement(),
  })

  createDismiss({
    enabled: () => open() && mounted(),
    refs: () => [popupElement(), positionerElement(), triggerElement()],
    onDismiss: event => {
      const reason =
        event.type === 'keydown' ? REASONS.escapeKey : REASONS.outsidePress
      setOpen(false, createChangeEventDetails(reason, event))
    },
    escapeKey: true,
    outsidePress: true,
  })

  function updateScrollArrowVisibility(scroller: HTMLElement | null) {
    if (!scroller) return
    const maxScrollTop = Math.max(
      0,
      scroller.scrollHeight - scroller.clientHeight
    )
    const scrollTop = Math.min(Math.max(0, scroller.scrollTop), maxScrollTop)
    scrollUpVisibleAssign(scrollTop > 0)
    scrollDownVisibleAssign(scrollTop < maxScrollTop)
  }

  createEffect(() => {
    if (!mounted()) {
      scrollUpVisibleAssign(false)
      scrollDownVisibleAssign(false)
      return
    }
    updateScrollArrowVisibility(listElement())
  })

  const controlRef: { current: HTMLElement | null } = {
    get current() {
      return triggerElement()
    },
    set current(_element: HTMLElement | null) {
      // Representative control is the trigger element.
    },
  }

  createRegisterFieldControl({
    controlRef,
    id,
    value,
    getFormValueOverride: () => () => serializedValue(),
    enabled: () => !disabled(),
    name: () => local.name,
  })

  const inputRefAssign = (element: HTMLInputElement | null) => {
    field.validation.inputRef.current = element
    const propRef = local.inputRef
    if (typeof propRef === 'function') {
      propRef(element)
    } else if (propRef && typeof propRef === 'object') {
      propRef.current = element
    }
  }

  const contextValue: SelectRootContextValue = {
    id,
    open,
    openAssign,
    setOpen,
    mounted,
    mountedAssign,
    transitionStatus,
    value: value,
    setValue,
    multiple,
    modal,
    disabled,
    readOnly,
    required,
    name,
    form: () => local.form,
    items: () => local.items,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    highlightItemOnHover,
    labelId,
    labelIdAssign,
    triggerElement,
    triggerElementAssign,
    positionerElement,
    positionerElementAssign,
    popupElement,
    popupElementAssign,
    listElement,
    listElementAssign,
    arrowElement,
    arrowElementAssign,
    backdropElement,
    backdropElementAssign,
    internalBackdropElement,
    internalBackdropElementAssign,
    portalId: () => portalId,
    openChangeReason,
    instantType,
    scrollUpVisible,
    scrollUpVisibleAssign,
    scrollDownVisible,
    scrollDownVisibleAssign,
    updateScrollArrowVisibility,
    onOpenChangeComplete: local.onOpenChangeComplete,
  }

  const multipleSelectedValues = createMemo(() => {
    const current = value()
    return Array.isArray(current) ? (current as Array<unknown>) : []
  })

  return (
    <SelectRootContext.Provider value={contextValue}>
      {local.children}
      <input
        id={`${id()}-hidden-input`}
        type="text"
        tabIndex={-1}
        aria-hidden
        form={local.form}
        name={multiple() ? undefined : name()}
        autocomplete={local.autoComplete}
        value={serializedValue()}
        disabled={disabled()}
        required={required() && !(multiple() && hasSelectedValue())}
        readOnly
        ref={inputRefAssign}
        style={name() ? visuallyHiddenInput : visuallyHidden}
        onFocus={() => {
          triggerElement()?.focus()
        }}
        onChange={(event: Event & { currentTarget: HTMLInputElement }) => {
          // Browser autofill path (Lite): match a registered item value/label.
          // Full valuesRef/labelsRef matching is deferred — see UPSTREAM_TEST_PARITY.md.
          if (
            event.defaultPrevented ||
            disabled() ||
            readOnly() ||
            multiple()
          ) {
            return
          }
          const nextValue = event.currentTarget.value
          if (!nextValue) return
          const details = createChangeEventDetails(REASONS.none, event)
          setValue(nextValue, details)
        }}
      />
      <Show when={multiple() && Boolean(name())}>
        <For each={multipleSelectedValues()}>
          {entry => (
            <input
              type="hidden"
              form={local.form}
              name={name()}
              value={stringifyAsValue(entry, itemToStringValue())}
              disabled={disabled()}
            />
          )}
        </For>
      </Show>
    </SelectRootContext.Provider>
  )
}
/**
 * Public state for {@link SelectRoot} (empty — root has no rendered element).
 */
export interface SelectRootState {}
/**
 * Props for {@link SelectRoot}.
 *
 * @typeParam TValue - Selected item value type.
 */
export interface SelectRootProps<TValue = unknown> {
  children?: JSX.Element
  /** The id of the select. */
  id?: string | undefined
  /**
   * The controlled value of the select.
   * To render an uncontrolled select, use `defaultValue` instead.
   */
  value?: TValue | Array<TValue> | null | undefined
  /**
   * The uncontrolled value of the select when initially rendered.
   * To render a controlled select, use `value` instead.
   */
  defaultValue?: TValue | Array<TValue> | null | undefined
  /** Event handler called when the value of the select changes. */
  onValueChange?:
    | ((
        value: TValue | Array<TValue> | null,
        eventDetails: SelectRootChangeEventDetails
      ) => void)
    | undefined
  /** Whether the select popup is currently open. */
  open?: boolean | undefined
  /**
   * Whether the select popup is initially open.
   * @default false
   */
  defaultOpen?: boolean | undefined
  /** Called when the select popup should open or close. */
  onOpenChange?:
    | ((open: boolean, eventDetails: SelectRootChangeEventDetails) => void)
    | undefined
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: boolean | undefined
  /**
   * Determines if the select enters a modal state when open.
   * @default true
   */
  modal?: boolean | undefined
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Whether the user should be unable to choose a different option.
   * @default false
   */
  readOnly?: boolean | undefined
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined
  /** Identifies the field when a form is submitted. */
  name?: string | undefined
  /** Identifies the form that owns the hidden input. */
  form?: string | undefined
  /** Hint to the browser for autofill. */
  autoComplete?: string | undefined
  /** A ref to access the hidden input element. */
  inputRef?:
    | ((element: HTMLInputElement | null) => void)
    | { current: HTMLInputElement | null }
    | undefined
  /**
   * Data structure of the items rendered in the select popup. When
   * specified, `Select.Value` renders the label of the selected item.
   */
  items?: SelectItems<TValue> | undefined
  /**
   * Converts an object item value to a string for display in the trigger.
   */
  itemToStringLabel?: ((itemValue: TValue) => string) | undefined
  /**
   * Converts an object item value to a string for form submission.
   */
  itemToStringValue?: ((itemValue: TValue) => string) | undefined
  /**
   * Custom comparison logic used to determine if an item value matches the
   * current selected value. Defaults to `Object.is` (+ `{ value }` shape).
   */
  isItemEqualToValue?:
    ((itemValue: TValue, value: TValue) => boolean) | undefined
  /**
   * Whether moving the pointer over items should highlight them.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined
  /** Imperative actions (`unmount`). */
  actionsRef?: SelectRootActions | undefined
}
/** Imperative actions exposed via `actionsRef`. */
export interface SelectRootActions {
  unmount: () => void
}
/** Change-event reason for Select. */
export type SelectRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.itemPress
  | typeof REASONS.focusOut
  | typeof REASONS.listNavigation
  | typeof REASONS.none
/** Change-event details for Select. */
export type SelectRootChangeEventDetails =
  BaseUIChangeEventDetails<SelectRootChangeEventReason>
/**
 * Runs `onChange` when `getValue` changes after the initial read.
 */
function createEffectOnValueChange<T>(
  getValue: () => T,
  onChange: () => void
): void {
  createEffect((prev: { value: T } | undefined) => {
    const next = getValue()
    if (prev !== undefined && !Object.is(prev.value, next)) {
      onChange()
    }
    return { value: next }
  })
}
