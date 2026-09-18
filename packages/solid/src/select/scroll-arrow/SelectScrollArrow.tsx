import { Show, mergeProps, splitProps } from 'solid-js'

import { createPressAndHold } from '../../internals/createPressAndHold'
import { createRender } from '../../internals/createRender'
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext'
import { useSelectRootContext } from '../root/SelectRootContext'

import { SelectScrollArrowDataAttributes } from './SelectScrollArrowDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

const SCROLL_STEP_PX = 8

/**
 * @internal
 * Shared implementation for {@link import('./SelectScrollUpArrow').SelectScrollUpArrow}
 * and {@link import('./SelectScrollDownArrow').SelectScrollDownArrow}.
 *
 * Lite scroll behavior: press-and-hold scrolls the list a fixed step per tick.
 * Upstream's item-height-aware scroll targeting is not replicated. See
 * `UPSTREAM_TEST_PARITY.md`.
 */
export function SelectScrollArrow(
  componentProps: SelectScrollArrowProps
): JSX.Element {
  const context = useSelectRootContext()
  const positioner = useSelectPositionerContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'direction',
    'keepMounted',
    'ref',
  ])

  const isUp = () => local.direction === 'up'
  const visible = () =>
    isUp() ? context.scrollUpVisible() : context.scrollDownVisible()

  const elementRef: { current: HTMLElement | null } = { current: null }

  const { pointerHandlers } = createPressAndHold({
    disabled: () => !visible(),
    elementRef,
    tick() {
      const scroller = context.listElement()
      if (!scroller) return false
      const delta = isUp() ? -SCROLL_STEP_PX : SCROLL_STEP_PX
      const before = scroller.scrollTop
      scroller.scrollTop += delta
      context.updateScrollArrowVisibility(scroller)
      return scroller.scrollTop !== before
    },
  })

  const state: SelectScrollArrowState = {
    get direction() {
      return local.direction
    },
    get visible() {
      return visible()
    },
    get side() {
      return positioner.side()
    },
  }

  const shouldRender = () => local.keepMounted || visible()

  return (
    <Show when={shouldRender()}>
      {createRender<SelectScrollArrowState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: {
          visible(value: unknown) {
            return value
              ? { [SelectScrollArrowDataAttributes.visible]: '' }
              : null
          },
          side(value: unknown) {
            return { [SelectScrollArrowDataAttributes.side]: String(value) }
          },
        },
        props: mergeProps(
          elementProps as Record<string, unknown>,
          pointerHandlers as unknown as Record<string, unknown>,
          {
            'aria-hidden': true,
            get class() {
              return local.class
            },
            get style() {
              const base: JSX.CSSProperties = { position: 'absolute' }
              const user = local.style
              if (user && typeof user === 'object' && !Array.isArray(user)) {
                return { ...base, ...user }
              }
              return base
            },
            get children() {
              return local.children ?? (isUp() ? '▲' : '▼')
            },
            ref(element: HTMLElement) {
              elementRef.current = element
              const userRef = local.ref
              if (typeof userRef === 'function') {
                userRef(element as HTMLDivElement)
              }
            },
          }
        ),
      })}
    </Show>
  )
}

/** Public state for select scroll arrows. */
export interface SelectScrollArrowState extends Record<string, unknown> {
  direction: 'up' | 'down'
  visible: boolean
  side: Side
}

/** Props for select scroll arrows. */
export type SelectScrollArrowProps = JSX.HTMLAttributes<HTMLDivElement> & {
  direction: 'up' | 'down'
  /**
   * Whether to keep the HTML element in the DOM while the select popup is not scrollable.
   * @default false
   */
  keepMounted?: boolean
  render?: RenderProp<SelectScrollArrowState, Record<string, unknown>>
}
