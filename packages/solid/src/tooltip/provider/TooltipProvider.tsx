import { createSignal, onCleanup, splitProps } from 'solid-js'

import { TooltipProviderContext } from './TooltipProviderContext'

import type { TooltipProviderContextValue } from './TooltipProviderContext'
import type { JSX } from 'solid-js'

/** Default ms after a tooltip closes during which a sibling opens instantly. */
const DEFAULT_TIMEOUT = 400

/**
 * Groups tooltips so that once one is open, adjacent tooltips within the
 * group open instantly (skipping their open delay) for `timeout` ms after
 * the previous one closes.
 *
 * Lite: implemented with a single shared instant-phase signal + timeout,
 * rather than upstream's `FloatingDelayGroup` (no shared floating-ui tree
 * required for this behavior).
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 *
 * @param componentProps - Provider props (`delay`, `closeDelay`, `timeout`).
 * @returns A Solid JSX fragment wrapping children in context.
 *
 * @example
 * ```tsx
 * import { Tooltip } from "@script-augur/base-ui-solid/tooltip"
 *
 * <Tooltip.Provider timeout={400}>
 *   <Tooltip.Root>...</Tooltip.Root>
 *   <Tooltip.Root>...</Tooltip.Root>
 * </Tooltip.Provider>
 * ```
 */
export function TooltipProvider(
  componentProps: TooltipProviderProps
): JSX.Element {
  const [local] = splitProps(componentProps, [
    'children',
    'delay',
    'closeDelay',
    'timeout',
  ])

  const [instantPhase, instantPhaseAssign] = createSignal(false)

  let resetTimeout: ReturnType<typeof setTimeout> | undefined

  const clearResetTimeout = () => {
    if (resetTimeout) {
      clearTimeout(resetTimeout)
      resetTimeout = undefined
    }
  }

  const notifyOpen = () => {
    clearResetTimeout()
    instantPhaseAssign(true)
  }

  const notifyClose = () => {
    clearResetTimeout()
    resetTimeout = setTimeout(() => {
      resetTimeout = undefined
      instantPhaseAssign(false)
    }, local.timeout ?? DEFAULT_TIMEOUT)
  }

  onCleanup(clearResetTimeout)

  const contextValue: TooltipProviderContextValue = {
    delay: () => local.delay,
    closeDelay: () => local.closeDelay,
    instantPhase,
    notifyOpen,
    notifyClose,
  }

  return (
    <TooltipProviderContext.Provider value={contextValue}>
      {local.children}
    </TooltipProviderContext.Provider>
  )
}

/** Props for {@link TooltipProvider}. */
export interface TooltipProviderProps {
  children?: JSX.Element
  /**
   * Open delay (ms) shared by tooltips in this group, absent an instant
   * phase. Falls back to each trigger's own `delay` / `OPEN_DELAY`.
   */
  delay?: number
  /**
   * Close delay (ms) shared by tooltips in this group. Falls back to each
   * trigger's own `closeDelay` / `0`.
   */
  closeDelay?: number
  /**
   * Ms after a tooltip closes during which an adjacent tooltip opens
   * instantly (no open delay, `instantType: 'delay'`).
   * @default 400
   */
  timeout?: number
}
