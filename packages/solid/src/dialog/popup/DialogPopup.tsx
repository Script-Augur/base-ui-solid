import { generateId } from '@script-augur/base-ui-utils'
import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useDialogPortalContext } from '../portal/DialogPortalContext'
import { useDialogRootContext } from '../root/DialogRootContext'
import { dialogStateAttributesMapping } from '../utils/stateAttributesMapping'

import { DialogPopupCssVars } from './DialogPopupCssVars'
import { DialogPopupDataAttributes } from './DialogPopupDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * A container for the dialog contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Popup props (`initialFocus`, `finalFocus`, …).
 * @returns A Solid JSX element.
 */
export function DialogPopup(componentProps: DialogPopupProps): JSX.Element {
  useDialogPortalContext()
  const context = useDialogRootContext()

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

  const popupId = local.id ?? generateId('base-ui-dialog')

  const nestedDialogOpen = () => context.nestedOpenDialogCount() > 0

  const state: DialogPopupState = {
    get open() {
      return context.open()
    },
    get nested() {
      return context.nested()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
    get nestedDialogOpen() {
      return nestedDialogOpen()
    },
  }

  return createRender<DialogPopupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: dialogStateAttributesMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return popupId
      },
      role: context.role,
      tabindex: -1,
      get 'aria-modal'() {
        return context.modal() === true ? true : undefined
      },
      get 'aria-labelledby'() {
        return context.titleElementId()
      },
      get 'aria-describedby'() {
        return context.descriptionElementId()
      },
      get ['attr:hidden']() {
        return context.mounted() ? undefined : true
      },
      get class() {
        return local.class
      },
      get style() {
        const base: JSX.CSSProperties = {
          [DialogPopupCssVars.nestedDialogs]: String(
            context.nestedOpenDialogCount()
          ),
        }
        const user = local.style
        if (user && typeof user === 'object' && !Array.isArray(user)) {
          return { ...base, ...user }
        }
        return base
      },
      get [DialogPopupDataAttributes.nested]() {
        return context.nested() ? '' : undefined
      },
      children: local.children,
      ref(element: HTMLElement) {
        context.popupElementAssign(element)

        // Optional initial focus override (element / false).
        const initial = local.initialFocus
        if (initial === false) {
          // Focus trap still may focus container; skip explicit override.
        } else if (initial instanceof HTMLElement) {
          queueMicrotask(() => initial.focus())
        }

        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}

/** Public state for {@link DialogPopup}. */
export interface DialogPopupState extends Record<string, unknown> {
  open: boolean
  transitionStatus: TransitionStatus
  nested: boolean
  nestedDialogOpen: boolean
}

/** Props for {@link DialogPopup}. */
export type DialogPopupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Element to focus when the dialog opens.
   * - `false`: do not move focus (beyond default trap behavior)
   * - `HTMLElement`: focus that element
   * - omitted: first tabbable / popup (via focus trap)
   */
  initialFocus?: boolean | HTMLElement | null
  /**
   * Element to focus when the dialog closes.
   * - `false`: do not restore focus
   * - `HTMLElement`: focus that element
   * - omitted: restore to trigger (via focus trap)
   */
  finalFocus?: boolean | HTMLElement | null
  render?: RenderProp<DialogPopupState, Record<string, unknown>>
}
