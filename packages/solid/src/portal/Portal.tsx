import { generateId } from '@script-augur/base-ui-utils'
import {
  Show,
  createMemo,
  createRenderEffect,
  createSignal,
  onCleanup,
  splitProps,
} from 'solid-js'
import { Portal as SolidPortal } from 'solid-js/web'

import { PortalContext, usePortalContext } from './PortalContext'
import { resolvePortalContainer } from './resolvePortalContainer'

import type {
  PortalContextValue,
  PortalFocusManagerState,
} from './PortalContext'
import type { PortalContainerProp } from './resolvePortalContainer'
import type { RenderProp } from '../internals/createRender'
import type { JSX } from 'solid-js'

const PORTAL_ATTRIBUTE = 'data-base-ui-portal'

/**
 * Moves children to a different part of the DOM (default: `document.body`).
 *
 * Solid’s `Portal` always mounts into a host `<div>`; that host is the portal
 * node (`data-base-ui-portal`), matching upstream `FloatingPortalLite` /
 * `useFloatingPortalNode`.
 *
 * Documentation: [Base UI overlays](https://base-ui.com/react/components/dialog)
 *
 * @param componentProps - Portal props (`container`, `class`, `style`, …).
 * @returns A Solid JSX element (empty while `container` is explicitly `null`
 *   or a container accessor still resolves to `null`).
 *
 * @example
 * ```tsx
 * import { Portal } from "@script-augur/base-ui-solid/portal"
 *
 * <Portal>
 *   <div role="dialog">Portaled content</div>
 * </Portal>
 *
 * <Portal container={customRoot}>
 *   <div>Into a custom container</div>
 * </Portal>
 * ```
 */
export function Portal(componentProps: PortalProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'container',
    'ref',
    'children',
    'id',
  ])

  const parentContext = usePortalContext()
  const [portalNode, portalNodeAssign] = createSignal<HTMLElement | null>(null)
  const [focusManagerState, focusManagerStateAssign] =
    createSignal<PortalFocusManagerState | null>(null)

  const uniqueId = createMemo(() => local.id ?? generateId('base-ui-portal'))

  const containerElement = createMemo(() =>
    resolvePortalContainer(local.container, parentContext?.portalNode() ?? null)
  )

  const contextValue: PortalContextValue = {
    portalNode,
    focusManagerState,
    focusManagerStateAssign,
  }

  // Keep host attributes in sync (Solid Portal owns the host element).
  createRenderEffect(() => {
    const node = portalNode()
    if (!node) return

    node.id = uniqueId()
    node.setAttribute(PORTAL_ATTRIBUTE, '')

    if (local.class != null) {
      node.className = local.class
    } else {
      node.removeAttribute('class')
    }

    const style = local.style
    if (style == null) {
      node.removeAttribute('style')
    } else if (typeof style === 'string') {
      node.setAttribute('style', style)
    } else {
      node.removeAttribute('style')
      Object.assign(node.style, style)
    }

    for (const [key, value] of Object.entries(
      elementProps as Record<string, unknown>
    )) {
      if (key === 'children' || key.startsWith('_$')) continue
      if (value == null || value === false) {
        node.removeAttribute(key)
        continue
      }
      if (value === true) {
        node.setAttribute(key, '')
        continue
      }
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'bigint'
      ) {
        node.setAttribute(key, String(value))
      }
    }
  })

  // `render` is accepted for FloatingPortalLite API parity; Solid’s Portal host
  // is always a div, so class/style/attributes are the supported customization.
  void local.render

  return (
    <Show when={containerElement()}>
      {container => (
        <PortalContext.Provider value={contextValue}>
          <SolidPortal
            mount={container()}
            ref={el => {
              portalNodeAssign(el)
              const userRef = local.ref
              if (typeof userRef === 'function') {
                userRef(el)
              } else if (
                userRef &&
                typeof userRef === 'object' &&
                'current' in userRef
              ) {
                ;(userRef as { current: HTMLDivElement | null }).current = el
              }
              onCleanup(() => {
                portalNodeAssign(prev => (prev === el ? null : prev))
                if (
                  userRef &&
                  typeof userRef === 'object' &&
                  'current' in userRef
                ) {
                  ;(userRef as { current: HTMLDivElement | null }).current =
                    null
                }
              })
            }}
          >
            {local.children}
          </SolidPortal>
        </PortalContext.Provider>
      )}
    </Show>
  )
}

/**
 * Public state exposed to `render` functions (empty for Portal).
 */
export interface PortalState extends Record<string, unknown> {}

/**
 * Props for {@link Portal}.
 */
export type PortalProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  /**
   * A parent element to render the portal host into.
   * Pass `null` (or an accessor that returns `null`) to defer mounting.
   * @default document.body (or the parent portal host when nested)
   */
  container?: PortalContainerProp
  /**
   * Base UI-style render prop for the portal host.
   * Not applied on Solid yet (host is owned by `solid-js/web` Portal); prefer
   * `class` / `style` / attributes. Accepted for API compatibility.
   */
  render?: RenderProp<PortalState, Record<string, unknown>>
  children?: JSX.Element
}
