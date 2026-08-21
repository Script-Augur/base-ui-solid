import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom'
import { createEffect, createSignal, onCleanup } from 'solid-js'

import type { Middleware, Placement, Strategy } from '@floating-ui/dom'
import type { Accessor } from 'solid-js'

export { offset, flip, shift, arrow, autoUpdate, computePosition }

/**
 * Thin Solid wrapper around `@floating-ui/dom` (`computePosition` + `autoUpdate`).
 *
 * @param options - Reference/floating accessors and placement options.
 * @returns Reactive coordinates and style helpers.
 *
 * @example
 * ```tsx
 * import { createSignal } from "solid-js"
 * import { useFloating } from "@script-augur/base-ui-solid"
 *
 * const [open] = createSignal(true)
 * const [reference, referenceAssign] = createSignal<HTMLElement | null>(null)
 * const [floating, floatingAssign] = createSignal<HTMLElement | null>(null)
 *
 * const { floatingStyles } = useFloating({
 *   open,
 *   reference,
 *   floating,
 *   placement: "bottom-start",
 * })
 *
 * // <button ref={referenceAssign}>Anchor</button>
 * // <div ref={floatingAssign} style={floatingStyles()}>Popover</div>
 * ```
 */
export function useFloating(options: UseFloatingOptions): UseFloatingReturn {
  const [x, xAssign] = createSignal(0)
  const [y, yAssign] = createSignal(0)
  const [strategy, strategyAssign] = createSignal<Strategy>(
    options.strategy ?? 'absolute'
  )
  const [placement, placementAssign] = createSignal<Placement>(
    options.placement ?? 'bottom'
  )
  const [middlewareData, middlewareDataAssign] = createSignal<
    Record<string, unknown>
  >({})

  createEffect(() => {
    const reference = options.reference()
    const floating = options.floating()
    const isOpen = options.open()

    if (!reference || !floating || !isOpen) return

    const middleware: Array<Middleware> = [
      offset(options.offset ?? 8),
      flip(),
      shift({ padding: 8 }),
      ...(options.middleware ?? []),
    ]

    const arrowEl = options.arrow?.()
    if (arrowEl) {
      middleware.push(arrow({ element: arrowEl }))
    }

    const cleanup = autoUpdate(reference, floating, () => {
      void computePosition(reference, floating, {
        placement: options.placement ?? 'bottom',
        strategy: options.strategy ?? 'absolute',
        middleware,
      }).then(data => {
        xAssign(data.x)
        yAssign(data.y)
        strategyAssign(data.strategy)
        placementAssign(data.placement)
        middlewareDataAssign(data.middlewareData as Record<string, unknown>)
      })
    })

    onCleanup(cleanup)
  })

  const floatingStyles = (): FloatingStyles => ({
    position: strategy(),
    top: `${y()}px`,
    left: `${x()}px`,
  })

  return {
    x,
    y,
    strategy,
    placement,
    middlewareData,
    floatingStyles,
  }
}

export type { Placement, Strategy, Middleware }

/**
 * Options for {@link useFloating}.
 */
export interface UseFloatingOptions {
  /** Whether positioning is active. */
  open: Accessor<boolean>
  /** Reference (anchor) element. */
  reference: Accessor<HTMLElement | null | undefined>
  /** Floating element to position. */
  floating: Accessor<HTMLElement | null | undefined>
  /** Optional arrow element for arrow middleware. */
  arrow?: Accessor<HTMLElement | null | undefined>
  /** Preferred placement. Defaults to `"bottom"`. */
  placement?: Placement
  /** CSS position strategy. Defaults to `"absolute"`. */
  strategy?: Strategy
  /** Offset middleware distance in px. Defaults to `8`. */
  offset?: number
  /** Additional Floating UI middleware. */
  middleware?: Array<Middleware>
}

/**
 * Inline styles derived from Floating UI coordinates.
 */
export interface FloatingStyles {
  /** CSS `position` strategy from Floating UI. */
  position: Strategy
  /** CSS `top` in pixels. */
  top: string
  /** CSS `left` in pixels. */
  left: string
  /** Optional CSS `transform` when used by consumers. */
  transform?: string
}

/**
 * Reactive Floating UI outputs from {@link useFloating}.
 */
export interface UseFloatingReturn {
  /** Horizontal coordinate in CSS pixels. */
  x: Accessor<number>
  /** Vertical coordinate in CSS pixels. */
  y: Accessor<number>
  /** Active CSS position strategy. */
  strategy: Accessor<Strategy>
  /** Resolved placement after middleware. */
  placement: Accessor<Placement>
  /** Middleware data bag from the last `computePosition` call. */
  middlewareData: Accessor<Record<string, unknown>>
  /** Convenience style object for the floating element. */
  floatingStyles: Accessor<FloatingStyles>
}
