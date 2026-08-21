import { Show, createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext'
import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useAccordionItemContext } from '../item/AccordionItemContext'
import { useAccordionRootContext } from '../root/AccordionRootContext'

import { AccordionPanelCssVars } from './AccordionPanelCssVars'
import { AccordionPanelDataAttributes } from './AccordionPanelDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { AccordionItemState } from '../item/AccordionItem'
import type { JSX } from 'solid-js'

/**
 * A collapsible panel with the accordion item contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 *
 * @param componentProps - Panel props (`keepMounted`, `hiddenUntilFound`, …).
 * @returns A Solid JSX element.
 */
export function AccordionPanel(
  componentProps: AccordionPanelProps
): JSX.Element {
  const root = useAccordionRootContext()
  const collapsible = useCollapsibleRootContext()
  const item = useAccordionItemContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'hiddenUntilFound',
    'keepMounted',
    'ref',
  ])

  const hiddenUntilFound = () =>
    local.hiddenUntilFound ?? root.hiddenUntilFound()
  const keepMounted = () => local.keepMounted ?? root.keepMounted()

  createEffect(() => {
    if (hiddenUntilFound() && keepMounted() === false) {
      console.warn(
        'Base UI: The `keepMounted={false}` prop on an `Accordion.Panel` is ignored when `hiddenUntilFound` is enabled on the panel or root, since the panel must remain mounted while closed.'
      )
    }
  })

  const registeredId = () => local.id || undefined
  const id = () => registeredId() ?? collapsible.defaultPanelId

  createEffect(() => {
    const nextId = registeredId()
    collapsible.registeredPanelIdAssign(
      prev => nextId ?? (prev === null ? undefined : prev)
    )
    onCleanup(() => {
      collapsible.registeredPanelIdAssign(current =>
        current === nextId || current === undefined ? null : current
      )
    })
  })

  const shouldRender = () =>
    collapsible.mounted() || keepMounted() || hiddenUntilFound()

  const hidden = (): boolean | 'until-found' | undefined => {
    if (collapsible.open()) return undefined
    if (hiddenUntilFound()) return 'until-found'
    if (keepMounted()) return true
    return true
  }

  return (
    <Show when={shouldRender()}>
      {createRender<AccordionPanelState, Record<string, unknown>>({
        defaultElement: 'div',
        state: item.state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get id() {
            return id()
          },
          role: 'region',
          get 'aria-labelledby'() {
            return item.triggerId()
          },
          // Solid maps `hidden` to the boolean IDL property; use `attr:hidden`
          // so `hidden="until-found"` is preserved for Find-in-Page.
          get ['attr:hidden']() {
            return hidden()
          },
          get class() {
            return local.class
          },
          get style() {
            const base = {
              [AccordionPanelCssVars.accordionPanelHeight]: 'auto',
              [AccordionPanelCssVars.accordionPanelWidth]: 'auto',
            }
            const user = local.style
            if (user && typeof user === 'object' && !Array.isArray(user)) {
              return { ...base, ...(user as Record<string, string>) }
            }
            return base
          },
          get [AccordionPanelDataAttributes.index]() {
            return String(item.state.index)
          },
          get [AccordionPanelDataAttributes.open]() {
            return dataAttr(collapsible.open())
          },
          get [AccordionPanelDataAttributes.orientation]() {
            return item.state.orientation
          },
          get [AccordionPanelDataAttributes.disabled]() {
            return dataAttr(item.state.disabled)
          },
          ref: local.ref,
        }),
      })}
    </Show>
  )
}

/** Public state for {@link AccordionPanel} (same as item). */
export type AccordionPanelState = AccordionItemState

/**
 * Props for {@link AccordionPanel}.
 */
export type AccordionPanelProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Allows the browser's built-in page search to find and expand the panel
   * contents. Uses `hidden="until-found"` and keeps the panel mounted.
   * Inherits from root when omitted.
   */
  hiddenUntilFound?: boolean
  /**
   * Whether to keep the element in the DOM while the panel is hidden.
   * Ignored when `hiddenUntilFound` is used. Inherits from root when omitted.
   */
  keepMounted?: boolean
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<AccordionPanelState, Record<string, unknown>>
}
