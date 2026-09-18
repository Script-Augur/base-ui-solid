import { generateId } from '@script-augur/base-ui-utils'
import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import { useDialogPortalContext } from '../../dialog/portal/DialogPortalContext'
import { useDialogRootContext } from '../../dialog/root/DialogRootContext'
import { createRender } from '../../internals/createRender'
import { transitionStatusMapping } from '../../internals/stateAttributesMapping'
import { DrawerProviderReporter } from '../root/DrawerProviderReporter'
import { useDrawerRootContext } from '../root/DrawerRootContext'

import { DrawerPopupCssVars } from './DrawerPopupCssVars'
import { DrawerPopupDataAttributes } from './DrawerPopupDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { DrawerSwipeDirection } from '../root/DrawerRootContext'
import type { JSX } from 'solid-js'

const OPEN_HOOK = { [DrawerPopupDataAttributes.open]: '' }
const CLOSED_HOOK = { [DrawerPopupDataAttributes.closed]: '' }
const EXPANDED_HOOK = { [DrawerPopupDataAttributes.expanded]: '' }
const NESTED_DRAWER_OPEN_HOOK = {
  [DrawerPopupDataAttributes.nestedDrawerOpen]: '',
}
const NESTED_DRAWER_SWIPING_HOOK = {
  [DrawerPopupDataAttributes.nestedDrawerSwiping]: '',
}
const SWIPING_HOOK = { [DrawerPopupDataAttributes.swiping]: '' }

const drawerPopupStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  transitionStatus: TransitionStatus
  expanded: boolean
  nested: boolean
  nestedDrawerOpen: boolean
  nestedDrawerSwiping: boolean
  swipeDirection: DrawerSwipeDirection
  swiping: boolean
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  ...transitionStatusMapping,
  expanded(value) {
    return value ? EXPANDED_HOOK : null
  },
  nestedDrawerOpen(value) {
    return value ? NESTED_DRAWER_OPEN_HOOK : null
  },
  nestedDrawerSwiping(value) {
    return value ? NESTED_DRAWER_SWIPING_HOOK : null
  },
  swipeDirection(value) {
    return { [DrawerPopupDataAttributes.swipeDirection]: value }
  },
  swiping(value) {
    return value ? SWIPING_HOOK : null
  },
}

/**
 * A container for the drawer contents.
 * Renders a `<div>` element.
 *
 * Lite: swipe CSS vars stay at idle (`0px` / `1`); gesture updates deferred.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param componentProps - Popup props (`initialFocus`, `finalFocus`, …).
 * @returns A Solid JSX element.
 */
export function DrawerPopup(componentProps: DrawerPopupProps): JSX.Element {
  useDialogPortalContext()
  const dialog = useDialogRootContext()
  const drawer = useDrawerRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'initialFocus',
    'finalFocus',
    'ref',
    'id',
  ])

  const popupId = local.id ?? generateId('base-ui-drawer')

  createEffect(() => {
    dialog.popupInitialFocusAssign(local.initialFocus)
    dialog.popupFinalFocusAssign(local.finalFocus)
  })

  createEffect(() => {
    const element = dialog.popupElement()
    if (!element) return
    const measure = () => {
      drawer.onPopupHeightChange(element.getBoundingClientRect().height)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    onCleanup(() => {
      observer.disconnect()
      drawer.onPopupHeightChange(0)
    })
  })

  // Upstream: parent nested presence is open || transitionStatus === 'ending'
  // (not nested Root mount).
  createEffect(() => {
    const notify = drawer.notifyParentHasNestedDrawer
    if (!notify) return
    notify(dialog.open() || dialog.transitionStatus() === 'ending')
  })

  // Upstream: report frontmost height only while open.
  createEffect(() => {
    const notify = drawer.notifyParentFrontmostHeight
    if (!notify) return
    if (!dialog.open()) {
      notify(0)
      return
    }
    notify(drawer.frontmostHeight())
  })

  onCleanup(() => {
    drawer.notifyParentHasNestedDrawer?.(false)
    drawer.notifyParentFrontmostHeight?.(0)
  })

  const nestedDrawerOpen = () => drawer.hasNestedDrawer()

  const state: DrawerPopupState = {
    get open() {
      return dialog.open()
    },
    get transitionStatus() {
      return dialog.transitionStatus()
    },
    get expanded() {
      return drawer.expanded()
    },
    get nested() {
      return dialog.nested()
    },
    get nestedDrawerOpen() {
      return nestedDrawerOpen()
    },
    get nestedDrawerSwiping() {
      return drawer.nestedSwiping()
    },
    get swipeDirection() {
      return drawer.swipeDirection()
    },
    get swiping() {
      return drawer.swiping()
    },
  }

  // Build the host once during setup. Do NOT wrap `createRender(...)` in a
  // JSX `{...}` expression — Solid treats that as a reactive computation, so
  // reading `hasNestedDrawer` / height inside outProps would recreate the
  // Popup and remount nested drawers (presence true/false oscillation).
  const popup = createRender<DrawerPopupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: drawerPopupStateAttributesMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return popupId
      },
      get role() {
        return dialog.role()
      },
      tabindex: -1,
      get 'aria-modal'() {
        return dialog.modal() === true ? true : undefined
      },
      get 'aria-labelledby'() {
        return dialog.titleElementId()
      },
      get 'aria-describedby'() {
        return dialog.descriptionElementId()
      },
      get ['attr:hidden']() {
        return dialog.mounted() ? undefined : true
      },
      get class() {
        return local.class
      },
      get style() {
        const height = drawer.popupHeight()
        const frontmost = drawer.frontmostHeight()
        const base: JSX.CSSProperties = {
          [DrawerPopupCssVars.nestedDrawers]: String(
            nestedDrawerOpen() ? 1 : 0
          ),
          [DrawerPopupCssVars.swipeMovementX]: '0px',
          [DrawerPopupCssVars.swipeMovementY]: '0px',
          [DrawerPopupCssVars.snapPointOffset]: '0px',
          [DrawerPopupCssVars.swipeStrength]: '1',
        }
        if (height > 0) {
          base[DrawerPopupCssVars.height] = `${height}px`
        }
        if (frontmost > 0) {
          base[DrawerPopupCssVars.frontmostHeight] = `${frontmost}px`
        }
        const user = local.style
        if (user && typeof user === 'object' && !Array.isArray(user)) {
          return { ...base, ...user }
        }
        return base
      },
      get [DrawerPopupDataAttributes.nested]() {
        return dialog.nested() ? '' : undefined
      },
      children: local.children,
      ref(element: HTMLElement) {
        dialog.popupElementAssign(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })

  return (
    <>
      <DrawerProviderReporter />
      {popup}
    </>
  )
}

/** Public state for {@link DrawerPopup}. */
export interface DrawerPopupState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
  expanded: boolean
  nested: boolean
  nestedDrawerOpen: boolean
  nestedDrawerSwiping: boolean
  swipeDirection: DrawerSwipeDirection
  swiping: boolean
}

/** Props for {@link DrawerPopup}. */
export type DrawerPopupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Element to focus when the drawer opens.
   * - `false`: do not move focus
   * - `true` / omitted / `null`: first tabbable / popup (via focus trap)
   * - `HTMLElement`: focus that element
   */
  initialFocus?: boolean | HTMLElement | null
  /**
   * Element to focus when the drawer closes.
   * - `false`: do not restore focus
   * - `true` / omitted / `null`: restore to trigger (via focus trap)
   * - `HTMLElement`: focus that element
   */
  finalFocus?: boolean | HTMLElement | null
  render?: RenderProp<DrawerPopupState, Record<string, unknown>>
}
