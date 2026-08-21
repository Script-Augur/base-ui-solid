import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { dataAttr } from '../../internals/useRender'
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext'

import { CollapsibleTriggerDataAttributes } from './CollapsibleTriggerDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { CollapsibleRootState } from '../root/CollapsibleRoot'
import type { JSX } from 'solid-js'

/**
 * A button that opens and closes the collapsible panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 *
 * @param componentProps - Trigger props (`disabled`, `nativeButton`, `render`, …).
 * @returns A Solid JSX element.
 */
export function CollapsibleTrigger(
  componentProps: CollapsibleTriggerProps
): JSX.Element {
  const context = useCollapsibleRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'ref',
  ])

  const disabled = () => local.disabled ?? context.disabled()

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: () => true,
    native: () => local.nativeButton ?? true,
  })

  return createRender<CollapsibleTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state: context.state,
    render: local.render,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          onClick(event: MouseEvent) {
            context.handleTrigger(event)
          },
        }) as Record<string, unknown>
      ),
      {
        get 'aria-expanded'() {
          return context.open()
        },
        get 'aria-controls'() {
          return context.open() ? context.panelId() : undefined
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get [CollapsibleTriggerDataAttributes.panelOpen]() {
          return dataAttr(context.open())
        },
        ref(element: HTMLElement) {
          buttonRef(element)
          const userRef = local.ref
          if (typeof userRef === 'function') {
            userRef(element as HTMLButtonElement)
          }
        },
      }
    ),
  })
}

/** Public state for {@link CollapsibleTrigger} (same as root). */
export type CollapsibleTriggerState = CollapsibleRootState

/**
 * Props for {@link CollapsibleTrigger}.
 */
export type CollapsibleTriggerProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  /** Whether the trigger should ignore user interaction. */
  disabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * @default true
   */
  nativeButton?: boolean
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<CollapsibleTriggerState, Record<string, unknown>>
}
