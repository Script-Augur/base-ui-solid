import { createContext, useContext } from 'solid-js'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { Accessor, Setter } from 'solid-js'

/**
 * Shared Navigation Menu root state for compound parts.
 */
export const NavigationMenuRootContext =
  createContext<NavigationMenuRootContextValue>()

/**
 * Reads the nearest {@link NavigationMenuRoot} context.
 *
 * @param optional - When `true`, returns `undefined` outside a root (nested detection).
 * @returns Context value, or `undefined` when `optional` and no provider.
 */
export function useNavigationMenuRootContext(
  optional?: false
): NavigationMenuRootContextValue
export function useNavigationMenuRootContext(
  optional: true
): NavigationMenuRootContextValue | undefined
export function useNavigationMenuRootContext(
  optional = false
): NavigationMenuRootContextValue | undefined {
  const context = useContext(NavigationMenuRootContext)
  if (context == null && !optional) {
    throw new Error(
      'Base UI: NavigationMenuRootContext is missing. Navigation Menu parts must be placed within <NavigationMenu.Root>.'
    )
  }
  return context
}

/**
 * Context value published by {@link NavigationMenuRoot}.
 */
export interface NavigationMenuRootContextValue {
  open: Accessor<boolean>
  value: Accessor<unknown>
  setValue: (
    next: unknown,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
  mounted: Accessor<boolean>
  mountedAssign: Setter<boolean>
  transitionStatus: Accessor<TransitionStatus>
  positionerElement: Accessor<HTMLElement | null>
  positionerElementAssign: Setter<HTMLElement | null>
  popupElement: Accessor<HTMLElement | null>
  popupElementAssign: Setter<HTMLElement | null>
  viewportElement: Accessor<HTMLElement | null>
  viewportElementAssign: Setter<HTMLElement | null>
  triggerElement: Accessor<HTMLElement | null>
  triggerElementAssign: Setter<HTMLElement | null>
  rootElement: Accessor<HTMLElement | null>
  rootElementAssign: Setter<HTMLElement | null>
  currentContentElement: Accessor<HTMLElement | null>
  currentContentElementAssign: Setter<HTMLElement | null>
  activationDirection: Accessor<NavigationMenuActivationDirection>
  activationDirectionAssign: Setter<NavigationMenuActivationDirection>
  prevTriggerElement: Accessor<Element | null | undefined>
  prevTriggerElementAssign: Setter<Element | null | undefined>
  nested: Accessor<boolean>
  delay: Accessor<number>
  closeDelay: Accessor<number>
  orientation: Accessor<'horizontal' | 'vertical'>
  onOpenChangeComplete?: (open: boolean) => void
  closeReason: Accessor<ChangeEventReason | null>
  closeReasonAssign: Setter<ChangeEventReason | null>
}

/** Direction of activation when switching between triggers. */
export type NavigationMenuActivationDirection =
  'left' | 'right' | 'up' | 'down' | null
