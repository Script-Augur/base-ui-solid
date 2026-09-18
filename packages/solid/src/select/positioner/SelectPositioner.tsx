import {
  Show,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useFloating } from '../../internals/useFloating'
import { useSelectPortalContext } from '../portal/SelectPortalContext'
import { useSelectRootContext } from '../root/SelectRootContext'
import { selectPositionerStateAttributesMapping } from '../utils/stateAttributesMapping'

import { placementToSideAlign, sideAlignToPlacement } from './placement'
import { SelectPositionerContext } from './SelectPositionerContext'
import { SelectPositionerCssVars } from './SelectPositionerCssVars'

import type { Align, Side } from './placement'
import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * Positions the select popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Positioner props (`side`, `align`, `sideOffset`, …).
 * @returns A Solid JSX element when mounted / keepMounted.
 */
export function SelectPositioner(
  componentProps: SelectPositionerProps
): JSX.Element {
  const keepMounted = useSelectPortalContext()
  const context = useSelectRootContext()

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
    'alignItemWithTrigger',
  ])

  // Accepted for API parity; Lite positioning uses flip/shift defaults and
  // does not align the selected item under the trigger. See
  // UPSTREAM_TEST_PARITY.md.
  void local.collisionBoundary
  void local.collisionPadding
  void local.arrowPadding
  void local.sticky
  void local.disableAnchorTracking
  void local.collisionAvoidance
  void local.alignOffset
  void local.alignItemWithTrigger

  const [arrowEl, arrowElAssign] = createSignal<HTMLElement | null>(null)

  const preferredSide = () => local.side ?? 'bottom'
  const preferredAlign = () => local.align ?? 'start'
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

  const state: SelectPositionerState = {
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
      <SelectPositionerContext.Provider value={positionerContext}>
        {createRender<SelectPositionerState, Record<string, unknown>>({
          defaultElement: 'div',
          state,
          render: local.render,
          mapStateToDataAttributes: true,
          stateAttributesMapping:
            selectPositionerStateAttributesMapping as StateAttributesMapping<SelectPositionerState>,
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
                [SelectPositionerCssVars.transformOrigin]: `${resolved().align} ${resolved().side}`,
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
      </SelectPositionerContext.Provider>
    </Show>
  )
}

/** Public state for {@link SelectPositioner}. */
export interface SelectPositionerState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  anchorHidden: boolean
  instant: string | undefined
}

/** Props for {@link SelectPositioner}. */
export type SelectPositionerProps = JSX.HTMLAttributes<HTMLDivElement> & {
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
   * @default 'start'
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
  /**
   * Whether the selected item should align vertically with the trigger.
   * Default matches upstream (`true`), but Lite positioning does not
   * measure/align the selected item yet — the prop is accepted as a no-op.
   * See UPSTREAM_TEST_PARITY.md.
   * @default true
   */
  alignItemWithTrigger?: boolean
  render?: RenderProp<SelectPositionerState, Record<string, unknown>>
}
