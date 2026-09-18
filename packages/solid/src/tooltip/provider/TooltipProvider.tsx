import { createSignal, onCleanup, splitProps } from 'solid-js'

import { REASONS } from '../../internals/createChangeEventDetails'

import { TooltipProviderContext } from './TooltipProviderContext'

import type {
  TooltipProviderContextValue,
  TooltipProviderRegisteredRoot,
} from './TooltipProviderContext'
import type { JSX } from 'solid-js'

/** Default ms after a tooltip closes during which a sibling opens instantly. */
const DEFAULT_TIMEOUT = 400

/**
 * Groups tooltips so that once one is open, adjacent tooltips within the
 * group open instantly (skipping their open delay) for `timeout` ms after
 * the previous one closes.
 *
 * Lite: shared instant-phase + open-count (no FloatingDelayGroup floating
 * tree). Opening one tooltip closes other open siblings in the group with
 * reason `none`.
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

  const roots = new Map<string, TooltipProviderRegisteredRoot>()
  let nextRootId = 0
  let openCount = 0
  let resetTimeout: ReturnType<typeof setTimeout> | undefined

  const clearResetTimeout = () => {
    if (resetTimeout) {
      clearTimeout(resetTimeout)
      resetTimeout = undefined
    }
  }

  const registerRoot = (
    root: Omit<TooltipProviderRegisteredRoot, 'id'>
  ): { id: string; unregister: () => void } => {
    const id = `tooltip-root-${nextRootId++}`
    roots.set(id, { id, ...root })
    return {
      id,
      unregister: () => {
        roots.delete(id)
      },
    }
  }

  const notifyOpen = (id: string) => {
    clearResetTimeout()
    // Exclusive open: close other visible members with reason `none`
    // (silent — does not call notifyClose; we adjust the count below).
    let closed = 0
    for (const [otherId, root] of roots) {
      if (otherId === id) continue
      if (root.isOpen()) {
        root.closeFromProvider(REASONS.none)
        closed += 1
      }
    }
    openCount = openCount - closed + 1
    instantPhaseAssign(true)
  }

  const notifyClose = (_id: string) => {
    openCount = Math.max(0, openCount - 1)
    if (openCount === 0) {
      clearResetTimeout()
      resetTimeout = setTimeout(() => {
        resetTimeout = undefined
        instantPhaseAssign(false)
      }, local.timeout ?? DEFAULT_TIMEOUT)
    } else {
      // Another member is still open — keep instant phase; do not start reset.
      clearResetTimeout()
    }
  }

  onCleanup(clearResetTimeout)

  const contextValue: TooltipProviderContextValue = {
    delay: () => local.delay,
    closeDelay: () => local.closeDelay,
    instantPhase,
    registerRoot,
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
   * Ms after the last tooltip in the group closes during which an adjacent
   * tooltip opens instantly (no open delay, `instantType: 'delay'`).
   * @default 400
   */
  timeout?: number
}
