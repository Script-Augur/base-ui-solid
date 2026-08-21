import {
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  splitProps,
} from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'

import { CollapsibleRootContext } from './CollapsibleRootContext'
import { CollapsibleRootDataAttributes } from './CollapsibleRootDataAttributes'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of the collapsible.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 *
 * @param componentProps - Root props (`open`, `defaultOpen`, `onOpenChange`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Collapsible } from "@script-augur/base-ui-solid/collapsible"
 *
 * <Collapsible.Root defaultOpen={false}>
 *   <Collapsible.Trigger>Details</Collapsible.Trigger>
 *   <Collapsible.Panel>Hidden content</Collapsible.Panel>
 * </Collapsible.Root>
 * ```
 */
export function CollapsibleRoot(
  componentProps: CollapsibleRootProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'ref',
  ])

  const defaultPanelId = createUniqueId()
  const [registeredPanelId, registeredPanelIdAssign] = createSignal<
    string | null | undefined
  >(undefined)

  const [open, openAssign] = createControlled({
    value: () => local.open,
    defaultValue: local.defaultOpen ?? false,
  })

  const [mounted, mountedAssign] = createSignal(false)
  createEffect(() => {
    mountedAssign(open())
  })

  const disabled = () => local.disabled ?? false

  const panelId = () => {
    const registered = registeredPanelId()
    if (registered === null) return undefined
    return registered ?? defaultPanelId
  }

  const handleTrigger = (event: Event) => {
    if (disabled()) return

    const nextOpen = !open()
    const eventDetails = createChangeEventDetails(REASONS.triggerPress, event)
    local.onOpenChange?.(nextOpen, eventDetails)
    if (eventDetails.isCanceled) return

    openAssign(nextOpen)
  }

  const state: CollapsibleRootState = {
    get open() {
      return open()
    },
    get disabled() {
      return disabled()
    },
  }

  const contextValue = {
    defaultPanelId,
    disabled,
    handleTrigger,
    mounted,
    open,
    panelId,
    state,
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

  return (
    <CollapsibleRootContext.Provider value={contextValue}>
      {createRender<CollapsibleRootState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get [CollapsibleRootDataAttributes.open]() {
            return dataAttr(open())
          },
          get [CollapsibleRootDataAttributes.closed]() {
            return dataAttr(!open())
          },
          ref: local.ref,
        }),
      })}
    </CollapsibleRootContext.Provider>
  )
}

/**
 * Public state exposed to `render` functions.
 */
export interface CollapsibleRootState extends Record<string, unknown> {
  /** Whether the collapsible panel is open. */
  open: boolean
  /** Whether the collapsible ignores user interaction. */
  disabled: boolean
}

/**
 * Props for {@link CollapsibleRoot}.
 */
export type CollapsibleRootProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'defaultValue'
> & {
  /**
   * Whether the collapsible panel is currently open.
   * Controlled counterpart of `defaultOpen`.
   */
  open?: boolean
  /**
   * Whether the collapsible panel is initially open.
   * Uncontrolled counterpart of `open`.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the panel should open or close.
   * Call `eventDetails.cancel()` to prevent the update.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: CollapsibleRootChangeEventDetails
  ) => void
  /** Whether the component should ignore user interaction. @default false */
  disabled?: boolean
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<CollapsibleRootState, Record<string, unknown>>
}

/** Change-event reason for {@link CollapsibleRoot}. */
export type CollapsibleRootChangeEventReason = ChangeEventReason

/** Change-event details for {@link CollapsibleRoot}. */
export type CollapsibleRootChangeEventDetails =
  BaseUIChangeEventDetails<CollapsibleRootChangeEventReason>
