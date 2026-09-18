import { mergeProps, splitProps } from 'solid-js'

import { useDialogRootContext } from '../../dialog/root/DialogRootContext'
import { createRender } from '../../internals/createRender'
import { useDrawerRootContext } from '../root/DrawerRootContext'

import { DrawerSwipeAreaDataAttributes } from './DrawerSwipeAreaDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { DrawerSwipeDirection } from '../root/DrawerRootContext'
import type { JSX } from 'solid-js'

const OPEN_HOOK = { [DrawerSwipeAreaDataAttributes.open]: '' }
const CLOSED_HOOK = { [DrawerSwipeAreaDataAttributes.closed]: '' }
const SWIPING_HOOK = { [DrawerSwipeAreaDataAttributes.swiping]: '' }
const DISABLED_HOOK = { [DrawerSwipeAreaDataAttributes.disabled]: '' }

const swipeAreaStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  swiping: boolean
  swipeDirection: DrawerSwipeDirection
  disabled: boolean
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  swiping(value) {
    return value ? SWIPING_HOOK : null
  },
  swipeDirection(value) {
    return { [DrawerSwipeAreaDataAttributes.swipeDirection]: value }
  },
  disabled(value) {
    return value ? DISABLED_HOOK : null
  },
}
/**
 * An invisible area that listens for swipe gestures to open the drawer.
 * Renders a `<div>` element.
 *
 * **Lite:** renders with correct data attributes; open-via-swipe gestures are
 * deferred (no pointer listeners / movement vars).
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param componentProps - SwipeArea props.
 * @returns A Solid JSX element.
 */
export function DrawerSwipeArea(
  componentProps: DrawerSwipeAreaProps
): JSX.Element {
  const dialog = useDialogRootContext(true)
  const drawer = useDrawerRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'disabled',
    'swipeDirection',
    'ref',
  ])

  const disabled = () => local.disabled ?? false
  const swipeDirection = () =>
    local.swipeDirection ?? oppositeSwipeDirection(drawer.swipeDirection())

  const state: DrawerSwipeAreaState = {
    get open() {
      return dialog?.open() ?? false
    },
    get swiping() {
      // Lite: SwipeArea never drives gestures.
      return false
    },
    get swipeDirection() {
      return swipeDirection()
    },
    get disabled() {
      return disabled()
    },
  }

  return createRender<DrawerSwipeAreaState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: swipeAreaStateAttributesMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get ['aria-hidden']() {
        return true
      },
      children: local.children,
      ref: local.ref,
    }),
  })
}
/** Public state for {@link DrawerSwipeArea}. */
export interface DrawerSwipeAreaState extends Record<string, unknown> {
  open: boolean
  swiping: boolean
  swipeDirection: DrawerSwipeDirection
  disabled: boolean
}
/** Props for {@link DrawerSwipeArea}. */
export type DrawerSwipeAreaProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Whether the swipe area is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * The swipe direction that opens the drawer.
   * Defaults to the opposite of `Drawer.Root` `swipeDirection`.
   */
  swipeDirection?: DrawerSwipeDirection
  render?: RenderProp<DrawerSwipeAreaState, Record<string, unknown>>
}
function oppositeSwipeDirection(
  direction: DrawerSwipeDirection
): DrawerSwipeDirection {
  switch (direction) {
    case 'up':
      return 'down'
    case 'down':
      return 'up'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
  }
}
