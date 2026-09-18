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
import { getFilter } from '../../internals/filter'
import { createRegisterFieldControl } from '../../internals/field-register-control/createRegisterFieldControl'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { createFocusTrap } from '../../internals/focusTrap'
import { useFormContext } from '../../internals/form-context/FormContext'
import { createScrollLock } from '../../internals/scrollLock'
import { stringifyAsLabel } from '../../internals/filter'
import { defaultItemEquality } from '../utils/itemEquality'
import {
  resolveSelectedLabel,
  stringifyAsValue,
} from '../utils/resolveValueLabel'

import { ComboboxRootContext } from './ComboboxRootContext'

import type { ComboboxRootContextValue } from './ComboboxRootContext'
import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { ComboboxItems } from '../utils/resolveValueLabel'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Root props (`value`, `open`, `inputValue`, …).
 * @returns A Solid JSX fragment wrapping children in context.
 */
export function ComboboxRoot<TValue = unknown>(
  componentProps: ComboboxRootProps<TValue>
): JSX.Element {
  const [local] = splitProps(
    componentProps as ComboboxRootProps<unknown> & Record<string, unknown>,
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
      'inputValue',
      'defaultInputValue',
      'onInputValueChange',
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
      'filteredItems',
      'filter',
      'limit',
      'locale',
      'itemToStringLabel',
      'itemToStringValue',
      'isItemEqualToValue',
      'highlightItemOnHover',
      'openOnInputClick',
      'autoHighlight',
      'loopFocus',
      'onItemHighlighted',
      'actionsRef',
      'grid',
      'virtualized',
      'inline',
    ]
  )

  // Lite no-ops accepted for API parity.
  void local.grid
  void local.virtualized
  void local.inline

  const { clearErrors } = useFormContext()
  const field = useFieldRootContext()
  const [labelId, labelIdAssign] = createSignal<string | undefined>(undefined)

  const disabled = () => field.disabled() || Boolean(local.disabled)
  const readOnly = () => local.readOnly ?? false
  const required = () => local.required ?? false
  const multiple = () => local.multiple ?? false
  const modal = () => local.modal ?? false
  const name = () => field.name() ?? local.name
  const highlightItemOnHover = () => local.highlightItemOnHover ?? true
  const openOnInputClick = () => local.openOnInputClick ?? true
  const autoHighlight = () => local.autoHighlight ?? false
  const loopFocus = () => local.loopFocus ?? true

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

  const [inputValue, inputValueAssign] = createControlled<string>({
    value: () =>
      local.inputValue == null ? undefined : String(local.inputValue),
    defaultValue:
      local.defaultInputValue == null
        ? ''
        : String(local.defaultInputValue),
  })

  const { mounted, mountedAssign, transitionStatus } =
    createTransitionStatus(open)

  const [inputElement, inputElementAssign] =
    createSignal<HTMLInputElement | null>(null)
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
  const [visibleItemIds, visibleItemIdsAssign] = createSignal<
    ReadonlySet<string>
  >(new Set())

  const portalId = `base-ui-combobox-portal-${generatedId}`

  const itemToStringValue = () => local.itemToStringValue
  const itemToStringLabel = () => local.itemToStringLabel

  const defaultFilter = createMemo(() =>
    getFilter({ locale: local.locale }).contains
  )

  const activeFilter = ():
    | null
    | ((
        itemValue: unknown,
        query: string,
        itemToString?: (itemValue: unknown) => string
      ) => boolean) => {
    if (local.filter === null) return null
    if (local.filter) return local.filter as typeof local.filter
    return defaultFilter()
  }

  const matchesQuery = (itemValue: unknown, labelHint?: string): boolean => {
    const query = inputValue()
    if (!query) return true
    const filterFn = activeFilter()
    if (filterFn == null) return true
    const toString =
      itemToStringLabel() ??
      (labelHint != null
        ? () => labelHint
        : (item: unknown) => stringifyAsLabel(item))
    return filterFn(itemValue, query, toString as (item: unknown) => string)
  }

  const computedFilteredItems = createMemo(() => {
    if (local.filteredItems) return local.filteredItems as ReadonlyArray<unknown>
    const source = local.items
    if (!source || !Array.isArray(source)) return undefined

    const flat = flattenItems(source as ComboboxItems<unknown>)
    const query = inputValue()
    const filterFn = activeFilter()
    let result =
      !query || filterFn == null
        ? flat
        : flat.filter(entry => {
            const label =
              typeof entry === 'object' &&
              entry != null &&
              'label' in entry &&
              'value' in entry
                ? String((entry as { label: unknown }).label)
                : undefined
            const itemValue =
              typeof entry === 'object' &&
              entry != null &&
              'value' in entry
                ? (entry as { value: unknown }).value
                : entry
            return matchesQuery(itemValue, label)
          })

    const limit = local.limit ?? -1
    if (limit >= 0) {
      result = result.slice(0, limit)
    }
    return result
  })

  const listEmpty = createMemo(() => {
    const filtered = computedFilteredItems()
    if (filtered) return filtered.length === 0
    return visibleItemIds().size === 0 && Boolean(inputValue())
  })

  const visibleItemCount = createMemo(() => {
    const filtered = computedFilteredItems()
    if (filtered) return filtered.length
    return visibleItemIds().size
  })

  function registerVisibleItem(itemId: string) {
    visibleItemIdsAssign(prev => {
      if (prev.has(itemId)) return prev
      const next = new Set(prev)
      next.add(itemId)
      return next
    })
  }

  function unregisterVisibleItem(itemId: string) {
    visibleItemIdsAssign(prev => {
      if (!prev.has(itemId)) return prev
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }

  function fillInputFromValue(itemValue: unknown): string {
    const label = resolveSelectedLabel(
      itemValue,
      local.items as ComboboxItems<unknown> | undefined,
      itemToStringLabel() as ((item: unknown) => string) | undefined
    )
    if (typeof label === 'string') return label
    return stringifyAsLabel(
      itemValue,
      itemToStringLabel() as ((item: unknown) => string) | undefined
    )
  }

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
    eventDetails: ComboboxRootChangeEventDetails
  ) => {
    local.onOpenChange?.(nextOpen, eventDetails)
    if (eventDetails.isCanceled) return

    const reason = eventDetails.reason
    openAssign(nextOpen)
    if (nextOpen) {
      openChangeReasonAssign(reason)
    }

    const isKeyboard =
      (reason === REASONS.triggerPress || reason === REASONS.inputPress) &&
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
    eventDetails: ComboboxRootChangeEventDetails
  ) => {
    local.onValueChange?.(nextValue, eventDetails)
    if (eventDetails.isCanceled) return
    valueAssign(nextValue)
  }

  const setInputValue = (
    nextInputValue: string,
    eventDetails: ComboboxRootChangeEventDetails
  ) => {
    local.onInputValueChange?.(nextInputValue, eventDetails)
    if (eventDetails.isCanceled) return
    inputValueAssign(nextInputValue)
  }

  createScrollLock(() => open() && modal() === true && mounted())

  createFocusTrap({
    enabled: () => open() && mounted() && modal() === true,
    container: popupElement,
    initialFocus: () => {
      const popup = popupElement()
      if (!popup) return undefined
      const selected = popup.querySelector<HTMLElement>(
        '[role="option"][aria-selected="true"]'
      )
      return selected ?? popup.querySelector<HTMLElement>('[role="option"]')
    },
    restoreFocus: () => inputElement() ?? triggerElement(),
  })

  createDismiss({
    enabled: () => open() && mounted(),
    refs: () => [
      popupElement(),
      positionerElement(),
      triggerElement(),
      inputElement(),
    ],
    onDismiss: event => {
      const reason =
        event.type === 'keydown' ? REASONS.escapeKey : REASONS.outsidePress
      setOpen(false, createChangeEventDetails(reason, event))
    },
    escapeKey: true,
    outsidePress: true,
  })

  const controlRef: { current: HTMLElement | null } = {
    get current() {
      return inputElement() ?? triggerElement()
    },
    set current(_element: HTMLElement | null) {
      // Representative control is the input element.
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

  const contextValue: ComboboxRootContextValue = {
    id,
    open,
    openAssign,
    setOpen,
    mounted,
    mountedAssign,
    transitionStatus,
    value: value,
    setValue,
    inputValue,
    setInputValue,
    multiple,
    modal,
    disabled,
    readOnly,
    required,
    name,
    form: () => local.form,
    items: () => local.items as ComboboxItems<unknown> | undefined,
    filteredItems: computedFilteredItems,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    highlightItemOnHover,
    openOnInputClick,
    autoHighlight,
    loopFocus,
    listEmpty,
    matchesQuery,
    registerVisibleItem,
    unregisterVisibleItem,
    visibleItemCount,
    labelId,
    labelIdAssign,
    inputElement,
    inputElementAssign,
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
    onOpenChangeComplete: local.onOpenChangeComplete,
    onItemHighlighted: local.onItemHighlighted as
      | ComboboxRootContextValue['onItemHighlighted']
      | undefined,
    fillInputFromValue,
  }

  const multipleSelectedValues = createMemo(() => {
    const current = value()
    return Array.isArray(current) ? (current as Array<unknown>) : []
  })

  return (
    <ComboboxRootContext.Provider value={contextValue}>
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
          inputElement()?.focus()
        }}
        onChange={(event: Event & { currentTarget: HTMLInputElement }) => {
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
    </ComboboxRootContext.Provider>
  )
}

/** Public state for {@link ComboboxRoot} (empty — root has no rendered element). */
export interface ComboboxRootState {}

/** Props for {@link ComboboxRoot}. */
export interface ComboboxRootProps<TValue = unknown> {
  children?: JSX.Element
  id?: string | undefined
  value?: TValue | Array<TValue> | null | undefined
  defaultValue?: TValue | Array<TValue> | null | undefined
  onValueChange?:
    | ((
        value: TValue | Array<TValue> | null,
        eventDetails: ComboboxRootChangeEventDetails
      ) => void)
    | undefined
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?:
    | ((open: boolean, eventDetails: ComboboxRootChangeEventDetails) => void)
    | undefined
  onOpenChangeComplete?: ((open: boolean) => void) | undefined
  inputValue?: string | number | ReadonlyArray<string> | undefined
  defaultInputValue?: string | number | ReadonlyArray<string> | undefined
  onInputValueChange?:
    | ((
        inputValue: string,
        eventDetails: ComboboxRootChangeEventDetails
      ) => void)
    | undefined
  multiple?: boolean | undefined
  /**
   * Whether the popup enters a modal state when open.
   * @default false
   */
  modal?: boolean | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  name?: string | undefined
  form?: string | undefined
  /** HTML autofill hint (not the Aria filter mode). */
  autoComplete?: string | undefined
  inputRef?:
    | ((element: HTMLInputElement | null) => void)
    | { current: HTMLInputElement | null }
    | undefined
  items?: ComboboxItems<TValue> | undefined
  filteredItems?: ReadonlyArray<unknown> | undefined
  filter?:
    | null
    | ((
        itemValue: TValue,
        query: string,
        itemToString?: (itemValue: TValue) => string
      ) => boolean)
    | undefined
  /**
   * Maximum number of filtered items to display.
   * @default -1
   */
  limit?: number | undefined
  locale?: Intl.LocalesArgument | undefined
  itemToStringLabel?: ((itemValue: TValue) => string) | undefined
  itemToStringValue?: ((itemValue: TValue) => string) | undefined
  isItemEqualToValue?:
    | ((itemValue: TValue, value: TValue) => boolean)
    | undefined
  /**
   * Whether moving the pointer over items should highlight them.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined
  /**
   * Whether the popup opens when clicking the input.
   * @default true
   */
  openOnInputClick?: boolean | undefined
  /**
   * Whether the first matching item is highlighted automatically while filtering.
   * @default false
   */
  autoHighlight?: boolean | undefined
  /**
   * Whether to loop keyboard focus.
   * @default true
   */
  loopFocus?: boolean | undefined
  onItemHighlighted?:
    | ((
        highlightedValue: TValue | undefined,
        eventDetails: ComboboxRootHighlightEventDetails
      ) => void)
    | undefined
  actionsRef?: ComboboxRootActions | undefined
  /** Lite no-op — accepted for API parity. */
  grid?: boolean | undefined
  /** Lite no-op — accepted for API parity. */
  virtualized?: boolean | undefined
  /** Lite no-op — accepted for API parity. */
  inline?: boolean | undefined
}

/** Imperative actions exposed via `actionsRef`. */
export interface ComboboxRootActions {
  unmount: () => void
}

/** Change-event reason for Combobox. */
export type ComboboxRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.inputPress
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.clearPress
  | typeof REASONS.chipRemovePress
  | typeof REASONS.cancelOpen
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.itemPress
  | typeof REASONS.focusOut
  | typeof REASONS.listNavigation
  | typeof REASONS.closePress
  | typeof REASONS.none

/** Change-event details for Combobox. */
export type ComboboxRootChangeEventDetails =
  BaseUIChangeEventDetails<ComboboxRootChangeEventReason>

/** Highlight-event reason for Combobox. */
export type ComboboxRootHighlightEventReason =
  | 'keyboard'
  | 'pointer'
  | 'none'

/** Highlight-event details for Combobox. */
export interface ComboboxRootHighlightEventDetails {
  reason: ComboboxRootHighlightEventReason
  index: number
  event?: Event
}

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

function flattenItems(items: ComboboxItems<unknown>): ReadonlyArray<unknown> {
  if (!Array.isArray(items)) {
    return Object.entries(items).map(([value, label]) => ({ value, label }))
  }
  if (
    items.length > 0 &&
    typeof items[0] === 'object' &&
    items[0] !== null &&
    'items' in (items[0] as object)
  ) {
    return (items as ReadonlyArray<{ items: ReadonlyArray<unknown> }>).flatMap(
      group => group.items
    )
  }
  return items
}
