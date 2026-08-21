import {
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { CollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useAccordionRootContext } from '../root/AccordionRootContext'

import { AccordionItemContext } from './AccordionItemContext'
import { AccordionItemDataAttributes } from './AccordionItemDataAttributes'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { AccordionRootState, AccordionValue } from '../root/AccordionRoot'
import type { JSX } from 'solid-js'

/**
 * Groups an accordion header with the corresponding panel.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 *
 * @param componentProps - Item props (`value`, `disabled`, `onOpenChange`, …).
 * @returns A Solid JSX element.
 */
export function AccordionItem(componentProps: AccordionItemProps): JSX.Element {
  const root = useAccordionRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'onOpenChange',
    'value',
    'ref',
  ])

  const fallbackValue = createUniqueId()
  const itemValue = () => local.value ?? fallbackValue
  const registrationKey = createUniqueId()

  createEffect(() => {
    const unregister = root.registerItem(registrationKey)
    onCleanup(unregister)
  })

  const index = () => {
    const keys = root.itemKeys()
    const i = keys.indexOf(registrationKey)
    return i === -1 ? 0 : i
  }

  const disabled = () => Boolean(local.disabled) || root.disabled()
  const isOpen = () => root.value().indexOf(itemValue()) !== -1

  const [mounted, mountedAssign] = createSignal(false)
  createEffect(() => {
    mountedAssign(isOpen())
  })

  const defaultPanelId = createUniqueId()
  const [registeredPanelId, registeredPanelIdAssign] = createSignal<
    string | null | undefined
  >(undefined)

  const panelId = () => {
    const registered = registeredPanelId()
    if (registered === null) return undefined
    return registered ?? defaultPanelId
  }

  const defaultTriggerId = createUniqueId()
  const [registeredTriggerId, triggerIdAssign] = createSignal<
    string | null | undefined
  >(undefined)

  const triggerId = () => {
    const registered = registeredTriggerId()
    if (registered === null) return undefined
    return registered ?? defaultTriggerId
  }

  const handleTrigger = (event: Event) => {
    if (disabled()) return

    const nextOpen = !isOpen()
    const eventDetails = createChangeEventDetails(REASONS.triggerPress, event)
    local.onOpenChange?.(nextOpen, eventDetails)
    if (eventDetails.isCanceled) return

    root.handleValueChange(itemValue(), nextOpen, eventDetails)
  }

  const openAssign = (next: boolean) => {
    const eventDetails = createChangeEventDetails(REASONS.none)
    local.onOpenChange?.(next, eventDetails)
    if (eventDetails.isCanceled) return
    root.handleValueChange(itemValue(), next, eventDetails)
  }

  const itemState: AccordionItemState = {
    get value() {
      return root.state.value
    },
    get disabled() {
      return disabled()
    },
    get orientation() {
      return root.state.orientation
    },
    get hidden() {
      return !isOpen() && !mounted()
    },
    get index() {
      return index()
    },
    get open() {
      return isOpen()
    },
  }

  const collapsibleContext = {
    defaultPanelId,
    disabled,
    handleTrigger,
    mounted,
    open: isOpen,
    panelId,
    state: {
      get open() {
        return isOpen()
      },
      get disabled() {
        return disabled()
      },
    },
    mountedAssign,
    openAssign,
    registeredPanelIdAssign,
    onOpenChange: (
      next: boolean,
      eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
    ) => {
      local.onOpenChange?.(next, eventDetails)
    },
  }

  const accordionItemContext = {
    defaultTriggerId,
    open: isOpen,
    state: itemState,
    triggerIdAssign,
    triggerId,
  }

  return (
    <CollapsibleRootContext.Provider value={collapsibleContext}>
      <AccordionItemContext.Provider value={accordionItemContext}>
        {createRender<AccordionItemState, Record<string, unknown>>({
          defaultElement: 'div',
          state: itemState,
          render: local.render,
          props: mergeProps(elementProps as Record<string, unknown>, {
            get class() {
              return local.class
            },
            get style() {
              return local.style
            },
            get [AccordionItemDataAttributes.index]() {
              return String(index())
            },
            get [AccordionItemDataAttributes.disabled]() {
              return dataAttr(disabled())
            },
            get [AccordionItemDataAttributes.open]() {
              return dataAttr(isOpen())
            },
            ref: local.ref,
          }),
        })}
      </AccordionItemContext.Provider>
    </CollapsibleRootContext.Provider>
  )
}

/**
 * Public state exposed to `render` functions on accordion item parts.
 */
export interface AccordionItemState extends AccordionRootState {
  /** Whether the accordion item's panel is currently hidden. */
  hidden: boolean
  /** The item index among registered siblings. */
  index: number
  /** Whether the component is open. */
  open: boolean
}

/**
 * Props for {@link AccordionItem}.
 */
export type AccordionItemProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'defaultValue'
> & {
  /**
   * A unique value that identifies this accordion item.
   * If omitted, a unique id is generated. Use when controlling the accordion
   * or setting an initial open state via root `value` / `defaultValue`.
   */
  value?: AccordionValue[number]
  /** Whether this item should ignore user interaction. */
  disabled?: boolean
  /**
   * Called when the panel is opened or closed.
   * Call `eventDetails.cancel()` to prevent the update.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: AccordionItemChangeEventDetails
  ) => void
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<AccordionItemState, Record<string, unknown>>
}

/** Change-event reason for {@link AccordionItem}. */
export type AccordionItemChangeEventReason = ChangeEventReason

/** Change-event details for {@link AccordionItem}. */
export type AccordionItemChangeEventDetails =
  BaseUIChangeEventDetails<AccordionItemChangeEventReason>
