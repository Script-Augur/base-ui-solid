import {
  Show,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useFloating } from '../../internals/useFloating'
import { usePreviewCardPortalContext } from '../portal/PreviewCardPortalContext'
import { usePreviewCardRootContext } from '../root/PreviewCardRootContext'
import { positionerStateAttributesMapping } from '../utils/stateAttributesMapping'

import { placementToSideAlign, sideAlignToPlacement } from './placement'
import { PreviewCardPositionerContext } from './PreviewCardPositionerContext'
import { PreviewCardPositionerCssVars } from './PreviewCardPositionerCssVars'

import type { Align, Side } from './placement'
import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * Positions the preview-card against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 *
 * @param componentProps - Positioner props (`side`, `align`, `sideOffset`, …).
 * @returns A Solid JSX element when mounted / keepMounted.
 */
export function PreviewCardPositioner(
  componentProps: PreviewCardPositionerProps
): JSX.Element {
  const keepMounted = usePreviewCardPortalContext()
  const context = usePreviewCardRootContext()

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

  const preferredSide = () => local.side ?? 'bottom'
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

  const state: PreviewCardPositionerState = {
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
      return context.instantType()
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
      <PreviewCardPositionerContext.Provider value={positionerContext}>
        {createRender<PreviewCardPositionerState, Record<string, unknown>>({
          defaultElement: 'div',
          state,
          render: local.render,
          mapStateToDataAttributes: true,
          stateAttributesMapping:
            positionerStateAttributesMapping as StateAttributesMapping<PreviewCardPositionerState>,
          props: mergeProps(elementProps as Record<string, unknown>, {
            role: 'presentation',
            get ['attr:hidden']() {
              return context.mounted() ? undefined : true
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
                'pointer-events': !context.open() ? 'none' : undefined,
                [PreviewCardPositionerCssVars.transformOrigin]: `${resolved().align} ${resolved().side}`,
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
      </PreviewCardPositionerContext.Provider>
    </Show>
  )
}

/** Public state for {@link PreviewCardPositioner}. */
export interface PreviewCardPositionerState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  anchorHidden: boolean
  instant: string | undefined
}

/** Props for {@link PreviewCardPositioner}. */
export type PreviewCardPositionerProps = JSX.HTMLAttributes<HTMLDivElement> & {
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
   * @default 'bottom'
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
  render?: RenderProp<PreviewCardPositionerState, Record<string, unknown>>
}
