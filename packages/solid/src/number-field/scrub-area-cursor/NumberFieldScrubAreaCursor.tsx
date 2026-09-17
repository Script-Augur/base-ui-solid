import { ownerDocument, platform } from '@script-augur/base-ui-utils'
import { Show, createSignal, mergeProps, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { createRender } from '../../internals/createRender'
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext'
import { useNumberFieldScrubAreaContext } from '../scrub-area/NumberFieldScrubAreaContext'
import { stateAttributesMapping } from '../utils/stateAttributesMapping'

import type { RenderProp } from '../../internals/createRender'
import type { NumberFieldRootState } from '../root/NumberFieldRoot'
import type { JSX } from 'solid-js'

const CURSOR_STYLE: JSX.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  'pointer-events': 'none',
}

/**
 * A custom element to display instead of the native cursor while using the scrub area.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldScrubAreaCursor(
  componentProps: NumberFieldScrubAreaCursorProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'ref',
    'children',
  ])

  const { state } = useNumberFieldRootContext()
  const {
    isScrubbing,
    isTouchInput,
    isPointerLockDenied,
    assignScrubAreaCursorRef,
  } = useNumberFieldScrubAreaContext()

  const [domElement, domElementAssign] = createSignal<Element | null>(null)

  const shouldRender = () =>
    isScrubbing() &&
    !platform.engine.webkit &&
    !isTouchInput() &&
    !isPointerLockDenied()

  return (
    <Show when={shouldRender()}>
      <Portal mount={ownerDocument(domElement()).body}>
        {createRender<NumberFieldScrubAreaCursorState, Record<string, unknown>>(
          {
            defaultElement: 'span',
            state,
            render: local.render,
            stateAttributesMapping,
            ref: [
              local.ref,
              (el: Element | null | undefined) => {
                const node = (el as HTMLSpanElement | null) ?? null
                assignScrubAreaCursorRef(node)
                domElementAssign(node)
              },
            ],
            props: mergeProps(
              {
                role: 'presentation',
                style: CURSOR_STYLE,
                get class() {
                  return local.class
                },
                children: local.children,
              },
              elementProps as Record<string, unknown>
            ),
          }
        )}
      </Portal>
    </Show>
  )
}

export interface NumberFieldScrubAreaCursorState extends NumberFieldRootState {}

export interface NumberFieldScrubAreaCursorProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'children'
> {
  render?: RenderProp<NumberFieldScrubAreaCursorState, Record<string, unknown>>
  children?: JSX.Element
  ref?: ((element: Element) => void) | undefined
}
