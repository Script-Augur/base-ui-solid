import { createContext, useContext } from 'solid-js'

import type { ChangeEventReason } from '../../internals/createChangeEventDetails'
import type { Accessor } from 'solid-js'

/**
 * Instant-open delay grouping state shared by tooltips under one
 * {@link TooltipProvider}.
 */
export const TooltipProviderContext =
  createContext<TooltipProviderContextValue>()

/**
 * Reads the nearest {@link TooltipProvider} context.
 *
 * @param optional - When `true`, returns `undefined` outside a provider.
 * @returns Context value, or `undefined` when `optional` and no provider.
 */
export function useTooltipProviderContext(
  optional?: false
): TooltipProviderContextValue
export function useTooltipProviderContext(
  optional: true
): TooltipProviderContextValue | undefined
export function useTooltipProviderContext(
  optional = false
): TooltipProviderContextValue | undefined {
  const context = useContext(TooltipProviderContext)
  if (context == null && !optional) {
    throw new Error(
      'Base UI: Tooltip.Provider context requested outside <Tooltip.Provider>.'
    )
  }
  return context
}

/**
 * A Root registered with the provider for sibling exclusive-open.
 */
export interface TooltipProviderRegisteredRoot {
  id: string
  isOpen: () => boolean
  closeFromProvider: (reason: ChangeEventReason) => void
}

/**
 * Context value published by {@link TooltipProvider}.
 */
export interface TooltipProviderContextValue {
  /** Group open delay (ms), or `undefined` to defer to `OPEN_DELAY`. */
  delay: Accessor<number | undefined>
  /** Group close delay (ms), or `undefined` to defer to `0`. */
  closeDelay: Accessor<number | undefined>
  /**
   * `true` while any tooltip in the group is open, or was closed less than
   * `timeout` ms ago with no other member open — the next tooltip to open
   * should skip its open delay and instant-transition (`instantType: 'delay'`).
   */
  instantPhase: Accessor<boolean>
  /**
   * Registers a Root for sibling exclusive-open.
   * @returns The assigned `id` and an `unregister` cleanup.
   */
  registerRoot: (
    root: Omit<TooltipProviderRegisteredRoot, 'id'>
  ) => { id: string; unregister: () => void }
  /** Called by a Root when its tooltip opens (`id` from registration). */
  notifyOpen: (id: string) => void
  /** Called by a Root when its tooltip closes (`id` from registration). */
  notifyClose: (id: string) => void
}
