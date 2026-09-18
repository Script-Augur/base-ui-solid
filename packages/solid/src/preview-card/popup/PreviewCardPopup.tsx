import { generateId } from '@script-augur/base-ui-utils'
import { mergeProps, splitProps, useContext } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { usePreviewCardPortalContext } from '../portal/PreviewCardPortalContext'
import { PreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext'
import { usePreviewCardRootContext } from '../root/PreviewCardRootContext'
import { previewCardPopupStateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { Align, Side } from '../positioner/placement'
import type { JSX } from 'solid-js'

/** Matches upstream `FOCUSABLE_POPUP_PROPS` (`data-base-ui-focusable`). */
const FOCUSABLE_ATTRIBUTE = 'data-base-ui-focusable'

/**
 * A container for the preview card contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 *
 * @param componentProps - Popup props.
 * @returns A Solid JSX element.
 */
export function PreviewCardPopup(
  componentProps: PreviewCardPopupProps
): JSX.Element {
  usePreviewCardPortalContext()
  const context = usePreviewCardRootContext()
  const positioner = useContext(PreviewCardPositionerContext)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'id',
  ])

  const popupId = local.id ?? generateId('base-ui-preview-card')

  const side = (): Side => positioner?.side() ?? 'bottom'
  const align = (): Align => positioner?.align() ?? 'center'

  const state: PreviewCardPopupState = {
    get open() {
      return context.open()
    },
    get side() {
      return side()
    },
    get align() {
      return align()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
    get instant() {
      return context.instantType()
    },
  }

  return createRender<PreviewCardPopupState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping:
      previewCardPopupStateAttributesMapping as StateAttributesMapping<PreviewCardPopupState>,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get id() {
        return popupId
      },
      tabindex: -1,
      [FOCUSABLE_ATTRIBUTE]: '',
      onPointerEnter() {
        context.onPopupPointerEnter()
      },
      onPointerLeave(event: PointerEvent) {
        context.onPopupPointerLeave(event)
      },
      get ['attr:hidden']() {
        return context.mounted() ? undefined : true
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      children: local.children,
      ref(element: HTMLElement) {
        context.popupElementAssign(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}

/** Public state for {@link PreviewCardPopup}. */
export interface PreviewCardPopupState extends Record<string, unknown> {
  open: boolean
  side: Side
  align: Align
  transitionStatus: TransitionStatus
  instant: string | undefined
}

/** Props for {@link PreviewCardPopup}. */
export type PreviewCardPopupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<PreviewCardPopupState, Record<string, unknown>>
}
