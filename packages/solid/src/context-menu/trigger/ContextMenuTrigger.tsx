import {
  Timeout,
  addEventListener,
  contains,
  getTarget,
  ownerDocument,
} from '@script-augur/base-ui-utils'
import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useMenuRootContext } from '../../menu/root/MenuRootContext'
import { findRootOwnerId } from '../../menu/utils/findRootOwnerId'
import { useContextMenuRootContext } from '../root/ContextMenuRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps.types'
import type { JSX } from 'solid-js'

const LONG_PRESS_DELAY = 500
const PRESSABLE_TRIGGER_HOOK = {
  'data-popup-open': '',
  'data-pressed': '',
}
/**
 * Pressable trigger open-state mapping (popup-open + pressed when open).
 */
const pressableTriggerOpenStateMapping: StateAttributesMapping<{
  open: boolean
}> = {
  open(value) {
    return value ? PRESSABLE_TRIGGER_HOOK : null
  },
}
/**
 * An area that opens the menu on right click or long press.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 *
 * @param componentProps - Trigger props.
 * @returns A Solid JSX element.
 */
export function ContextMenuTrigger(
  componentProps: ContextMenuTriggerProps
): JSX.Element {
  const contextMenu = useContextMenuRootContext(false)
  const menuRoot = useMenuRootContext(false)

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
  ])

  const open = menuRoot.store.useState('open')
  const disabled = menuRoot.store.useState('disabled')

  let triggerElement: HTMLElement | null = null
  let touchPosition: { x: number; y: number } | null = null
  let longPressPending = false
  let allowMouseUp = false
  let mouseUpAbortController: AbortController | null = null

  const longPressTimeout = new Timeout()
  const allowMouseUpTimeout = new Timeout()

  const handleLongPress = (x: number, y: number, event: Event) => {
    const isTouchEvent = event.type.startsWith('touch')
    contextMenu.initialCursorPointRef.current = { x, y }
    contextMenu.anchorAssign({
      getBoundingClientRect() {
        return DOMRect.fromRect({
          width: isTouchEvent ? 10 : 0,
          height: isTouchEvent ? 10 : 0,
          x,
          y,
        })
      },
    })
    allowMouseUp = false
    contextMenu.actionsRef.current?.setOpen(
      true,
      createChangeEventDetails(REASONS.triggerPress, event)
    )
    allowMouseUpTimeout.start(LONG_PRESS_DELAY, () => {
      allowMouseUp = true
    })
  }

  const cancelLongPress = () => {
    longPressTimeout.clear()
    longPressPending = false
    touchPosition = null
  }

  const handleContextMenu = (event: MouseEvent) => {
    if (disabled()) {
      return
    }
    contextMenu.allowMouseUpTriggerRef.current = true
    stopEvent(event)
    handleLongPress(event.clientX, event.clientY, event)

    const doc = ownerDocument(triggerElement)
    mouseUpAbortController?.abort()
    const controller = new AbortController()
    mouseUpAbortController = controller
    doc.addEventListener(
      'mouseup',
      mouseEvent => {
        contextMenu.allowMouseUpTriggerRef.current = false
        if (!allowMouseUp) {
          return
        }
        allowMouseUpTimeout.clear()
        allowMouseUp = false
        const mouseUpTarget = getTarget(mouseEvent)
        if (
          contains(
            contextMenu.positionerRef.current,
            mouseUpTarget as Element | null
          )
        ) {
          return
        }
        if (
          contextMenu.rootId &&
          mouseUpTarget &&
          findRootOwnerId(mouseUpTarget as Node) === contextMenu.rootId
        ) {
          return
        }
        contextMenu.actionsRef.current?.setOpen(
          false,
          createChangeEventDetails(REASONS.cancelOpen, mouseEvent)
        )
      },
      { once: true, signal: controller.signal }
    )
  }

  const handleTouchStart = (event: TouchEvent) => {
    if (disabled()) {
      cancelLongPress()
      return
    }
    contextMenu.allowMouseUpTriggerRef.current = false
    if (event.touches.length !== 1) {
      cancelLongPress()
      return
    }
    event.stopPropagation()
    const touch = event.touches[0]
    if (!touch) {
      cancelLongPress()
      return
    }
    touchPosition = { x: touch.clientX, y: touch.clientY }
    longPressPending = true
    longPressTimeout.start(LONG_PRESS_DELAY, () => {
      if (touchPosition) {
        handleLongPress(touchPosition.x, touchPosition.y, event)
      }
      longPressPending = false
    })
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      cancelLongPress()
      return
    }
    if (longPressPending && touchPosition) {
      const touch = event.touches[0]
      if (!touch) {
        cancelLongPress()
        return
      }
      const moveThreshold = 10
      const deltaX = Math.abs(touch.clientX - touchPosition.x)
      const deltaY = Math.abs(touch.clientY - touchPosition.y)
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        cancelLongPress()
      }
    }
  }

  onCleanup(() => {
    mouseUpAbortController?.abort()
    longPressTimeout.clear()
    allowMouseUpTimeout.clear()
  })

  createEffect(() => {
    if (disabled()) return
    const doc = ownerDocument(triggerElement)
    return addEventListener(doc, 'contextmenu', (event: Event) => {
      if (disabled()) return
      const target = getTarget(event) as Element | null
      if (
        contains(triggerElement, target) ||
        contains(contextMenu.internalBackdropRef.current, target) ||
        contains(contextMenu.backdropRef.current, target)
      ) {
        event.preventDefault()
      }
    })
  })

  const state: ContextMenuTriggerState = {
    get open() {
      return open()
    },
  }

  return createRender<ContextMenuTriggerState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    stateAttributesMapping: pressableTriggerOpenStateMapping,
    props: mergeProps(elementProps as Record<string, unknown>, {
      onContextMenu: handleContextMenu,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: cancelLongPress,
      onTouchCancel: cancelLongPress,
      get class() {
        return local.class
      },
      get style() {
        const base: JSX.CSSProperties = {
          '-webkit-touch-callout': 'none',
        }
        const user = local.style
        if (user && typeof user === 'object' && !Array.isArray(user)) {
          return { ...base, ...user }
        }
        return base
      },
      ref(element: HTMLElement) {
        triggerElement = element
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}
/** Public state for {@link ContextMenuTrigger}. */
export interface ContextMenuTriggerState extends Record<string, unknown> {
  /**
   * Whether the context menu is currently open.
   */
  open: boolean
}
/** Props for {@link ContextMenuTrigger}. */
export type ContextMenuTriggerProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ContextMenuTriggerState, Record<string, unknown>>
}
function stopEvent(event: Event) {
  event.preventDefault()
  event.stopPropagation()
}
