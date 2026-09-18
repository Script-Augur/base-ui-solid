import {
  Show,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useFloating } from '../../internals/useFloating'
import { useTooltipPortalContext } from '../portal/TooltipPortalContext'
import { useTooltipRootContext } from '../root/TooltipRootContext'
import { positionerStateAttributesMapping } from '../utils/stateAttributesMapping'

import { placementToSideAlign, sideAlignToPlacement } from './placement'
import { TooltipPositionerContext } from './TooltipPositionerContext'
import { TooltipPositionerCssVars } from './TooltipPositionerCssVars'

import type { Align, Side } from './placement'
import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * Positions the tooltip against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 *
 * @param componentProps - Positioner props (`side`, `align`, `sideOffset`, …).
 * @returns A Solid JSX element when mounted / keepMounted.
 */
export function TooltipPositioner(
  componentProps: TooltipPositionerProps
): JSX.Element {
  const keepMounted = useTooltipPortalContext()
  const context = useTooltipRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'anchor',
    'positionMethod',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'collisionBoundary',
    'collisionPadding',
    'arrowPadding',
    'sticky',
    'disableAnchorTracking',
    'collisionAvoidance',
  ])

  // Accepted for API parity; Lite positioning uses flip/shift defaults.
  void local.collisionBoundary
  void local.collisionPadding
  void local.arrowPadding
  void local.sticky
  void local.disableAnchorTracking
  void local.collisionAvoidance
  void local.alignOffset

  const [arrowEl, arrowElAssign] = createSignal<HTMLElement | null>(null)

  const preferredSide = () => local.side ?? 'top'
  const preferredAlign = () => local.align ?? 'center'
  const placement = () =>
    sideAlignToPlacement(preferredSide(), preferredAlign())

  const reference = createMemo(() => {
    const anchor = local.anchor
    if (anchor instanceof HTMLElement) return anchor
    if (typeof anchor === 'function') {
      const result = anchor()
      return result instanceof HTMLElement ? result : null
    }
    return context.triggerElement()
  })

  const floating = useFloating({
    open: () => context.mounted(),
    reference,
    floating: context.positionerElement,
    arrow: arrowEl,
    placement: placement(),
    strategy: local.positionMethod ?? 'absolute',
    offset: local.sideOffset ?? 0,
  })

  const resolved = createMemo(() => placementToSideAlign(floating.placement()))

  const arrowUncentered = createMemo(() => {
    const data = floating.middlewareData() as {
      arrow?: { centerOffset?: number }
    }
    return Math.abs(data.arrow?.centerOffset ?? 0) > 0.5
  })

  const arrowStyles = createMemo(() => {
    const data = floating.middlewareData() as {
      arrow?: { x?: number; y?: number }
    }
    const arrow = data.arrow
    if (!arrow) return {}
    const { side } = resolved()
    const styles: Record<string, string | undefined> = {}
    if (arrow.x != null) styles.left = `${arrow.x}px`
    if (arrow.y != null) styles.top = `${arrow.y}px`
    if (side === 'top') styles.bottom = '0px'
    if (side === 'bottom') styles.top = '0px'
    if (side === 'left') styles.right = '0px'
    if (side === 'right') styles.left = '0px'
    return styles
  })

  // Not hoverable / both-axis cursor-tracking / closed positioners must not
  // intercept pointer events. Matches upstream: only `'both'` forces inert
  // for trackCursorAxis (Lite still does not follow the pointer — see
  // UPSTREAM_TEST_PARITY.md).
  const inert = () =>
    !context.open() ||
    context.disableHoverablePopup() ||
    context.trackCursorAxis() === 'both'

  const state: TooltipPositionerState = {
    get open() {
      return context.open()
    },
    get side() {
      return resolved().side
    },
    get align() {
      return resolved().align
    },
    get anchorHidden() {
      return false
    },
    get instant() {
      return context.trackCursorAxis() === 'both'
        ? 'tracking-cursor'
        : context.instantType()
    },
  }

  const shouldRender = () => keepMounted || context.mounted()

  const positionerContext = {
    side: () => resolved().side,
    align: () => resolved().align,
    arrowRef: (el: HTMLElement | null) => {
      arrowElAssign(el)
      context.arrowElementAssign(el)
    },
    arrowUncentered,
    arrowStyles,
  }

  return (
    <Show when={shouldRender()}>
      <TooltipPositionerContext.Provider value={positionerContext}>
        {createRender<TooltipPositionerState, Record<string, unknown>>({
          defaultElement: 'div',
          state,
          render: local.render,
          mapStateToDataAttributes: true,
          stateAttributesMapping:
            positionerStateAttributesMapping as StateAttributesMapping<TooltipPositionerState>,
          props: mergeProps(elementProps as Record<string, unknown>, {
            role: 'presentation',
            get ['attr:hidden']() {
              return context.mounted() ? undefined : true
            },
            get ['attr:inert']() {
              return inert() ? true : undefined
            },
            get class() {
              return local.class
            },
            get style() {
              const styles = floating.floatingStyles()
              const base: JSX.CSSProperties = {
                position: styles.position,
                top: styles.top,
                left: styles.left,
                'pointer-events': inert() ? 'none' : undefined,
                [TooltipPositionerCssVars.transformOrigin]: `${resolved().align} ${resolved().side}`,
              }
              const user = local.style
              if (user && typeof user === 'object' && !Array.isArray(user)) {
                return { ...base, ...user }
              }
              return base
            },
            children: local.children,
            ref(element: HTMLElement) {
              context.positionerElementAssign(element)
              const userRef = local.ref
              if (typeof userRef === 'function') {
                userRef(element as HTMLDivElement)
              }
            },
          }),
        })}
      </TooltipPositionerContext.Provider>
    </Show>
  )
}

/** Public state for {@link TooltipPositioner}. */
export interface TooltipPositionerState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  anchorHidden: boolean
  instant: string | undefined
}

/** Props for {@link TooltipPositioner}. */
export type TooltipPositionerProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * An element to position the popup against.
   * By default, the popup is positioned against the trigger.
   */
  anchor?: HTMLElement | null | (() => HTMLElement | null | undefined)
  /**
   * CSS `position` strategy.
   * @default 'absolute'
   */
  positionMethod?: 'absolute' | 'fixed'
  /**
   * Which side of the anchor to place the popup on.
   * @default 'top'
   */
  side?: Side
  /**
   * Alignment along the side.
   * @default 'center'
   */
  align?: Align
  /**
   * Distance between the anchor and the popup in pixels.
   * @default 0
   */
  sideOffset?: number
  /**
   * Offset along the alignment axis in pixels.
   * @default 0
   */
  alignOffset?: number
  /** Collision boundary — accepted for API parity; Lite uses Floating UI defaults. */
  collisionBoundary?: unknown
  /**
   * Collision padding — accepted for API parity.
   * @default 5
   */
  collisionPadding?: number | Partial<Record<Side, number>>
  /**
   * Arrow padding — accepted for API parity.
   * @default 5
   */
  arrowPadding?: number
  /** Sticky collision — accepted for API parity. */
  sticky?: boolean
  /**
   * Whether to disable continuous anchor tracking.
   * @default false
   */
  disableAnchorTracking?: boolean
  /** Collision avoidance config — accepted for API parity. */
  collisionAvoidance?: unknown
  render?: RenderProp<TooltipPositionerState, Record<string, unknown>>
}
