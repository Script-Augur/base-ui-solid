import { Show, mergeProps, splitProps } from 'solid-js'

import { useDialogPortalContext } from '../../dialog/portal/DialogPortalContext'
import { useDialogRootContext } from '../../dialog/root/DialogRootContext'
import { createRender } from '../../internals/createRender'
import { transitionStatusMapping } from '../../internals/stateAttributesMapping'
import { useDrawerRootContext } from '../root/DrawerRootContext'

import { DrawerViewportDataAttributes } from './DrawerViewportDataAttributes'

import type { DialogRootContextValue } from '../../dialog/root/DialogRootContext'
import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

const OPEN_HOOK = { [DrawerViewportDataAttributes.open]: '' }
const CLOSED_HOOK = { [DrawerViewportDataAttributes.closed]: '' }

/**
 * Drawer Viewport mapping: same open/transition hooks as Dialog, but
 * **suppresses** `data-nested-dialog-open` (upstream Drawer.Viewport clears it;
 * drawer nesting uses Popup `data-nested-drawer-open` instead).
 */
const drawerViewportStateAttributesMapping: StateAttributesMapping<{
  open: boolean
  transitionStatus: TransitionStatus
  nested: boolean
  nestedDialogOpen: boolean
}> = {
  open(value) {
    return value ? OPEN_HOOK : CLOSED_HOOK
  },
  ...transitionStatusMapping,
  nestedDialogOpen() {
    return null
  },
}

/**
 * A positioning container for the drawer popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Lite: no swipe-dismiss / snap drag pipeline (deferred). Still matches
 * upstream Drawer.Viewport nested **data-attribute** surface by suppressing
 * Dialog’s `data-nested-dialog-open`.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 *
 * @param componentProps - Viewport props.
 * @returns A Solid JSX element when mounted / keepMounted.
 */
export function DrawerViewport(
  componentProps: DrawerViewportProps
): JSX.Element {
  const keepMounted = useDialogPortalContext()
  const dialog = useDialogRootContext()
  // Require Drawer root so misuse outside Drawer fails clearly.
  useDrawerRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const shouldRender = () => keepMounted || dialog.mounted()

  return (
    <Show when={shouldRender()}>
      <DrawerViewportHost
        dialog={dialog}
        local={local}
        elementProps={elementProps}
      />
    </Show>
  )
}

/** Public state for {@link DrawerViewport}. */
export interface DrawerViewportState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
  nested: boolean
  /**
   * Dialog nested-open count (state only). The matching data attribute is
   * suppressed — use Popup `data-nested-drawer-open` for drawer nesting CSS.
   */
  nestedDialogOpen: boolean
}

/** Props for {@link DrawerViewport}. */
export type DrawerViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<DrawerViewportState, Record<string, unknown>>
}

/**
 * Host under {@link Show} that **returns** `createRender` directly.
 * Calling `createRender` inside a JSX `{...}` expression would re-run when
 * tracked state attrs change and remount Popup children.
 */
function DrawerViewportHost(props: {
  dialog: DialogRootContextValue
  local: {
    render?: DrawerViewportProps['render']
    class?: DrawerViewportProps['class']
    style?: DrawerViewportProps['style']
    children?: DrawerViewportProps['children']
    ref?: DrawerViewportProps['ref']
  }
  elementProps: Record<string, unknown>
}): JSX.Element {
  const { dialog, local, elementProps } = props

  // Always false for the data-attribute surface (upstream clears nested-dialog
  // open). Do not read `nestedOpenDialogCount` — that would remount children
  // when a nested drawer opens.
  const state: DrawerViewportState = {
    get open() {
      return dialog.open()
    },
    get nested() {
      return dialog.nested()
    },
    get transitionStatus() {
      return dialog.transitionStatus()
    },
    get nestedDialogOpen() {
      return false
    },
  }

  return createRender<DrawerViewportState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: drawerViewportStateAttributesMapping,
    props: mergeProps(elementProps, {
      role: 'presentation',
      // Upstream Drawer.Viewport explicitly clears Dialog’s nested attr.
      [DrawerViewportDataAttributes.nestedDialogOpen]: undefined,
      get ['attr:hidden']() {
        return dialog.mounted() ? undefined : true
      },
      get class() {
        return local.class
      },
      get style() {
        const base: JSX.CSSProperties = {
          'pointer-events': !dialog.open() ? 'none' : undefined,
        }
        const user = local.style
        if (user && typeof user === 'object' && !Array.isArray(user)) {
          return { ...base, ...user }
        }
        return base
      },
      get [DrawerViewportDataAttributes.nested]() {
        return dialog.nested() ? '' : undefined
      },
      children: local.children,
      ref(element: HTMLElement) {
        dialog.viewportElementAssign(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}
