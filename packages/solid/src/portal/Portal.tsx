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
 *   or a container accessor still resolves to `null` / an invalid node).
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

  // Keep host attributes / listeners in sync (Solid Portal owns the host).
  // Track previous keys so removals clear stale data-* / aria / handlers —
  // matching upstream `useRenderElement` replace semantics.
  let syncedNode: HTMLElement | null = null
  let appliedAttrKeys = new Set<string>()
  const appliedListeners = new Map<string, BoundListener>()

  createRenderEffect(() => {
    const node = portalNode()
    if (!node) {
      syncedNode = null
      appliedAttrKeys = new Set()
      appliedListeners.clear()
      return
    }

    if (node !== syncedNode) {
      appliedAttrKeys = new Set()
      appliedListeners.clear()
      syncedNode = node
    }

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

    const nextAttrKeys = new Set<string>()
    const nextListeners = new Map<string, BoundListener>()

    for (const [key, value] of Object.entries(
      elementProps as Record<string, unknown>
    )) {
      if (key === 'children' || key.startsWith('_$')) continue

      const eventBinding = parseDomEventProp(key)
      if (eventBinding) {
        if (typeof value === 'function') {
          nextListeners.set(eventBinding.mapKey, {
            type: eventBinding.type,
            capture: eventBinding.capture,
            listener: value as EventListener,
          })
        }
        continue
      }

      if (value == null || value === false) {
        node.removeAttribute(key)
        continue
      }
      if (value === true) {
        node.setAttribute(key, '')
        nextAttrKeys.add(key)
        continue
      }
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'bigint'
      ) {
        node.setAttribute(key, String(value))
        nextAttrKeys.add(key)
      }
    }

    for (const key of appliedAttrKeys) {
      if (!nextAttrKeys.has(key)) {
        node.removeAttribute(key)
      }
    }
    appliedAttrKeys = nextAttrKeys

    for (const [mapKey, prev] of appliedListeners) {
      const next = nextListeners.get(mapKey)
      if (
        !next ||
        next.listener !== prev.listener ||
        next.capture !== prev.capture
      ) {
        node.removeEventListener(prev.type, prev.listener, prev.capture)
      }
    }
    for (const [mapKey, next] of nextListeners) {
      const prev = appliedListeners.get(mapKey)
      if (!prev || prev.listener !== next.listener) {
        node.addEventListener(next.type, next.listener, next.capture)
      }
    }
    appliedListeners.clear()
    for (const [mapKey, next] of nextListeners) {
      appliedListeners.set(mapKey, next)
    }
  })

  // `render` is accepted for FloatingPortalLite API parity; Solid’s Portal host
  // is always a div, so class/style/attributes/handlers are the supported
  // customization path until host `render` is implemented.
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
 *
 * Host customization (`class`, `style`, `data-*`, `aria-*`, and DOM event
 * handlers such as `onClick`) is applied to the portal host `<div>`. The
 * Base UI `render` prop is accepted for API parity but not applied yet.
 */
export type PortalProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  /**
   * A parent element to render the portal host into.
   * Pass `null` (or an accessor that returns `null`) to defer mounting.
   * Non-`HTMLElement` / non-`ShadowRoot` values also defer (they do not fall
   * through to `document.body`).
   * @default document.body (or the parent portal host when nested)
   */
  container?: PortalContainerProp
  /**
   * Base UI-style render prop for the portal host.
   * Not applied on Solid yet (host is owned by `solid-js/web` Portal); prefer
   * `class` / `style` / attributes / event handlers. Accepted for API
   * compatibility.
   */
  render?: RenderProp<PortalState, Record<string, unknown>>
  children?: JSX.Element
}

/**
 * Maps Solid/`HTMLAttributes` event props (`onClick`, `onClickCapture`) to
 * `addEventListener` type + capture. Returns `null` for non-event keys.
 */
function parseDomEventProp(
  key: string
): { type: string; capture: boolean; mapKey: string } | null {
  if (!/^on[A-Z]/.test(key)) return null

  let name = key.slice(2)
  let capture = false
  if (name.endsWith('Capture')) {
    capture = true
    name = name.slice(0, -7)
  }
  if (!name) return null

  const type = name.toLowerCase()
  return { type, capture, mapKey: `${type}:${capture ? '1' : '0'}` }
}

type BoundListener = {
  type: string
  capture: boolean
  listener: EventListener
}
