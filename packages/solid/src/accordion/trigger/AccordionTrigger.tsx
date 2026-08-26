import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { dataAttr } from '../../internals/useRender'
import { useAccordionItemContext } from '../item/AccordionItemContext'

import { AccordionTriggerDataAttributes } from './AccordionTriggerDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { AccordionItemState } from '../item/AccordionItem'
import type { JSX } from 'solid-js'

/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 *
 * @param componentProps - Trigger props (`disabled`, `nativeButton`, `render`, …).
 * @returns A Solid JSX element.
 */
export function AccordionTrigger(
  componentProps: AccordionTriggerProps
): JSX.Element {
  const collapsible = useCollapsibleRootContext()
  const item = useAccordionItemContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'id',
    'ref',
  ])

  const disabled = () => Boolean(local.disabled) || collapsible.disabled()

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    focusableWhenDisabled: () => true,
    native: () => local.nativeButton ?? true,
  })

  const registeredId = () => local.id || undefined
  const id = () => registeredId() ?? item.defaultTriggerId

  createEffect(() => {
    const nextId = registeredId()
    item.triggerIdAssign(prev => nextId ?? (prev === null ? undefined : prev))
    onCleanup(() => {
      item.triggerIdAssign(current =>
        current === nextId || current === undefined ? null : current
      )
    })
  })

  return createRender<AccordionTriggerState, Record<string, unknown>>({
    defaultElement: 'button',
    state: item.state,
    render: local.render,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          onClick(event: MouseEvent) {
            collapsible.handleTrigger(event)
          },
        }) as Record<string, unknown>
      ),
      {
        get id() {
          return id()
        },
        get 'aria-expanded'() {
          return collapsible.open()
        },
        get 'aria-controls'() {
          return collapsible.open() ? collapsible.panelId() : undefined
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get [AccordionTriggerDataAttributes.panelOpen]() {
          return dataAttr(collapsible.open())
        },
        get [AccordionTriggerDataAttributes.disabled]() {
          return dataAttr(disabled())
        },
        ref(element: HTMLElement) {
          buttonRefAssign(element)
          const userRef = local.ref
          if (typeof userRef === 'function') {
            userRef(element as HTMLButtonElement)
          }
        },
      }
    ),
  })
}

/** Public state for {@link AccordionTrigger} (same as item). */
export type AccordionTriggerState = AccordionItemState

/**
 * Props for {@link AccordionTrigger}.
 */
export type AccordionTriggerProps = Omit<
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
  render?: RenderProp<AccordionTriggerState, Record<string, unknown>>
}
