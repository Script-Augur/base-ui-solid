import { createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { transitionStatusMapping } from '../../internals/stateAttributesMapping'
import { useFloating } from '../../internals/useFloating'
import {
  placementToSideAlign,
  sideAlignToPlacement,
} from '../../popover/positioner/placement'
import { useToastProviderContext } from '../provider/ToastProviderContext'
import { ToastRootCssVars } from '../root/ToastRootCssVars'

import { ToastPositionerContext } from './ToastPositionerContext'
import { ToastPositionerCssVars } from './ToastPositionerCssVars'

import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../../popover/positioner/placement'
import type { ToastObject } from '../useToastManager'
import type { JSX } from 'solid-js'

const EMPTY_OBJECT = Object.freeze({}) as Record<string, never>
/**
 * Positions the toast against the anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Positioner props including `toast`.
 * @returns A Solid JSX element.
 */
export function ToastPositioner(
  componentProps: ToastPositionerProps
): JSX.Element {
  const store = useToastProviderContext()

  const [local, elementProps] = splitProps(componentProps, [
    'toast',
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

  const positionerProps = () =>
    (local.toast.positionerProps ?? EMPTY_OBJECT) as NonNullable<
      typeof local.toast.positionerProps
    >

  const [arrowEl, arrowElAssign] = createSignal<HTMLElement | null>(null)
  const [positionerEl, positionerElAssign] = createSignal<HTMLElement | null>(
    null
  )

  const preferredSide = () => local.side ?? positionerProps().side ?? 'top'
  const preferredAlign = () =>
    local.align ?? positionerProps().align ?? 'center'
  const placement = () =>
    sideAlignToPlacement(preferredSide(), preferredAlign())

  const reference = createMemo(() => {
    const anchorProp = local.anchor ?? positionerProps().anchor
    if (anchorProp instanceof HTMLElement) return anchorProp
    return null
  })

  const floating = useFloating({
    open: () => true,
    reference,
    floating: positionerEl,
    arrow: arrowEl,
    placement: placement(),
    strategy:
      local.positionMethod ?? positionerProps().positionMethod ?? 'absolute',
    offset: local.sideOffset ?? positionerProps().sideOffset ?? 0,
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
    const styles: JSX.CSSProperties = {}
    if (arrow.x != null) styles.left = `${arrow.x}px`
    if (arrow.y != null) styles.top = `${arrow.y}px`
    if (side === 'top') styles.bottom = '0px'
    if (side === 'bottom') styles.top = '0px'
    if (side === 'left') styles.right = '0px'
    if (side === 'right') styles.left = '0px'
    return styles
  })

  const domIndexOf = () => store.select('toastIndex', local.toast.id)()
  const visibleIndexOf = () =>
    store.select('toastVisibleIndex', local.toast.id)()

  const state: ToastPositionerState = {
    get side() {
      return resolved().side
    },
    get align() {
      return resolved().align
    },
    get anchorHidden() {
      return false
    },
  }

  const positionerContext = {
    side: () => resolved().side,
    align: () => resolved().align,
    arrowRef: (el: HTMLElement | null) => {
      arrowElAssign(el)
    },
    arrowUncentered,
    arrowStyles,
  }

  return (
    <ToastPositionerContext.Provider value={positionerContext}>
      {createRender<ToastPositionerState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: {
          ...transitionStatusMapping,
          anchorHidden(value: unknown) {
            return value ? { 'data-anchor-hidden': '' } : null
          },
        } as StateAttributesMapping<ToastPositionerState>,
        props: mergeProps(elementProps as Record<string, unknown>, {
          role: 'presentation',
          get class() {
            return local.class
          },
          get style() {
            const styles = floating.floatingStyles()
            const base: JSX.CSSProperties = {
              position: styles.position,
              top: styles.top,
              left: styles.left,
              [ToastPositionerCssVars.transformOrigin]: `${resolved().align} ${resolved().side}`,
              [ToastRootCssVars.index]: String(
                local.toast.transitionStatus === 'ending'
                  ? domIndexOf()
                  : visibleIndexOf()
              ),
            }
            const user = local.style
            if (user && typeof user === 'object' && !Array.isArray(user)) {
              return { ...base, ...user }
            }
            return base
          },
          get children() {
            return local.children
          },
          ref(element: HTMLElement) {
            positionerElAssign(element)
            const userRef = local.ref
            if (typeof userRef === 'function') {
              userRef(element as HTMLDivElement)
            }
          },
        }),
      })}
    </ToastPositionerContext.Provider>
  )
}
/** Public state for {@link ToastPositioner}. */
export interface ToastPositionerState extends Record<string, unknown> {
  side: Side
  align: Align
  anchorHidden: boolean
}
/** Props for {@link ToastPositioner}. */
export type ToastPositionerProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'toast'
> & {
  /**
   * An element to position the toast against.
   */
  anchor?: Element | null | undefined
  /**
   * CSS `position` strategy.
   * @default 'absolute'
   */
  positionMethod?: 'absolute' | 'fixed'
  /**
   * Which side of the anchor element to align the toast against.
   * @default 'top'
   */
  side?: Side | undefined
  /**
   * Alignment along the side.
   * @default 'center'
   */
  align?: Align
  /**
   * Distance between the anchor and the toast in pixels.
   * @default 0
   */
  sideOffset?: number
  /**
   * Offset along the alignment axis in pixels.
   * @default 0
   */
  alignOffset?: number
  /** Collision boundary — accepted for API parity. */
  collisionBoundary?: unknown
  /** Collision padding — accepted for API parity. */
  collisionPadding?: number | Partial<Record<Side, number>>
  /** Arrow padding — accepted for API parity. */
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
  /**
   * The toast object associated with the positioner.
   */
  toast: ToastObject<Record<string, never>>
  render?: RenderProp<ToastPositionerState, Record<string, unknown>>
}
