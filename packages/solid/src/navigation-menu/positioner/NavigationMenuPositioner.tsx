import {
  Show,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useFloating } from '../../internals/useFloating'
import { useNavigationMenuPortalContext } from '../portal/NavigationMenuPortalContext'
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext'
import { positionerStateAttributesMapping } from '../utils/stateAttributesMapping'

import { NavigationMenuPositionerContext } from './NavigationMenuPositionerContext'
import { NavigationMenuPositionerCssVars } from './NavigationMenuPositionerCssVars'
import { placementToSideAlign, sideAlignToPlacement } from './placement'

import type { Align, Side } from './placement'
import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

/**
 * Positions the navigation menu against the currently active trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 *
 * @param componentProps - Positioner props.
 * @returns A Solid JSX element when mounted / keepMounted.
 */
export function NavigationMenuPositioner(
  componentProps: NavigationMenuPositionerProps
): JSX.Element {
  const keepMounted = useNavigationMenuPortalContext()
  const context = useNavigationMenuRootContext()

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
    'trackAnchor',
    'collisionAvoidance',
  ])

  void local.collisionBoundary
  void local.collisionPadding
  void local.arrowPadding
  void local.sticky
  void local.trackAnchor
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

  const state: NavigationMenuPositionerState = {
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
      return false
    },
  }

  const shouldRender = () => keepMounted || context.mounted()

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
    <Show when={shouldRender()}>
      <NavigationMenuPositionerContext.Provider value={positionerContext}>
        {createRender<NavigationMenuPositionerState, Record<string, unknown>>({
          defaultElement: 'div',
          state,
          render: local.render,
          mapStateToDataAttributes: true,
          stateAttributesMapping:
            positionerStateAttributesMapping as StateAttributesMapping<NavigationMenuPositionerState>,
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
                [NavigationMenuPositionerCssVars.transformOrigin]: `${resolved().align} ${resolved().side}`,
              }
              const user = local.style
              if (user && typeof user === 'object' && !Array.isArray(user)) {
                return { ...base, ...user }
              }
              return base
            },
            children: local.children,
            onPointerEnter() {
              context.onPopupPointerEnter()
            },
            onPointerLeave(event: PointerEvent) {
              context.onPopupPointerLeave(event)
            },
            ref(element: HTMLElement) {
              context.positionerElementAssign(element)
              const userRef = local.ref
              if (typeof userRef === 'function') {
                userRef(element as HTMLDivElement)
              }
            },
          }),
        })}
      </NavigationMenuPositionerContext.Provider>
    </Show>
  )
}

/** Public state for {@link NavigationMenuPositioner}. */
export interface NavigationMenuPositionerState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  anchorHidden: boolean
  instant: boolean
}

/** Props for {@link NavigationMenuPositioner}. */
export type NavigationMenuPositionerProps =
  JSX.HTMLAttributes<HTMLDivElement> & {
    anchor?: HTMLElement | null | (() => HTMLElement | null | undefined)
    /**
     * @default 'absolute'
     */
    positionMethod?: 'absolute' | 'fixed'
    /**
     * @default 'bottom'
     */
    side?: Side
    /**
     * @default 'center'
     */
    align?: Align
    /**
     * @default 0
     */
    sideOffset?: number
    /**
     * @default 0
     */
    alignOffset?: number
    collisionBoundary?: unknown
    collisionPadding?: number | Partial<Record<Side, number>>
    arrowPadding?: number
    sticky?: boolean
    /**
     * @default true
     */
    trackAnchor?: boolean
    collisionAvoidance?: unknown
    render?: RenderProp<NavigationMenuPositionerState, Record<string, unknown>>
  }
