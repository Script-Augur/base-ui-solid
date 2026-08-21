import { Show, createEffect, mergeProps, onCleanup, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext'

import { CollapsiblePanelCssVars } from './CollapsiblePanelCssVars'
import { CollapsiblePanelDataAttributes } from './CollapsiblePanelDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { CollapsibleRootState } from '../root/CollapsibleRoot'
import type { JSX } from 'solid-js'

/**
 * A panel with the collapsible contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 *
 * @param componentProps - Panel props (`keepMounted`, `hiddenUntilFound`, …).
 * @returns A Solid JSX element.
 */
export function CollapsiblePanel(
  componentProps: CollapsiblePanelProps
): JSX.Element {
  const context = useCollapsibleRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'id',
    'hiddenUntilFound',
    'keepMounted',
    'ref',
  ])

  const hiddenUntilFound = () => local.hiddenUntilFound ?? false
  const keepMounted = () => local.keepMounted ?? false

  createEffect(() => {
    if (hiddenUntilFound() && keepMounted() === false) {
      console.warn(
        'Base UI: The `keepMounted={false}` prop on `Collapsible.Panel` is ignored when `hiddenUntilFound` is enabled, since the panel must remain mounted while closed.'
      )
    }
  })

  const registeredId = () => local.id || undefined
  const id = () => registeredId() ?? context.defaultPanelId

  createEffect(() => {
    const nextId = registeredId()
    context.registeredPanelIdAssign(
      prev => nextId ?? (prev === null ? undefined : prev)
    )
    onCleanup(() => {
      context.registeredPanelIdAssign(current =>
        current === nextId || current === undefined ? null : current
      )
    })
  })

  const shouldRender = () =>
    context.mounted() || keepMounted() || hiddenUntilFound()

  const hidden = (): boolean | 'until-found' | undefined => {
    if (context.open()) return undefined
    if (hiddenUntilFound()) return 'until-found'
    if (keepMounted()) return true
    return true
  }

  return (
    <Show when={shouldRender()}>
      {createRender<CollapsiblePanelState, Record<string, unknown>>({
        defaultElement: 'div',
        state: context.state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get id() {
            return id()
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
              [CollapsiblePanelCssVars.collapsiblePanelHeight]: 'auto',
              [CollapsiblePanelCssVars.collapsiblePanelWidth]: 'auto',
            }
            const user = local.style
            if (user && typeof user === 'object' && !Array.isArray(user)) {
              return { ...base, ...(user as Record<string, string>) }
            }
            return base
          },
          get [CollapsiblePanelDataAttributes.open]() {
            return dataAttr(context.open())
          },
          get [CollapsiblePanelDataAttributes.closed]() {
            return dataAttr(!context.open())
          },
          ref: local.ref,
        }),
      })}
    </Show>
  )
}

/** Public state for {@link CollapsiblePanel}. */
export type CollapsiblePanelState = CollapsibleRootState

/**
 * Props for {@link CollapsiblePanel}.
 */
export type CollapsiblePanelProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Allows the browser's built-in page search to find and expand the panel
   * contents. Uses `hidden="until-found"` and keeps the panel mounted.
   * @default false
   */
  hiddenUntilFound?: boolean
  /**
   * Whether to keep the element in the DOM while the panel is hidden.
   * Ignored when `hiddenUntilFound` is used.
   * @default false
   */
  keepMounted?: boolean
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<CollapsiblePanelState, Record<string, unknown>>
}
