import { mergeProps, onCleanup, onMount, splitProps, untrack } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useToastRootContext } from '../root/ToastRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A container for the contents of a toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Content props.
 * @returns A Solid JSX element.
 */
export function ToastContent(componentProps: ToastContentProps): JSX.Element {
  const root = useToastRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  let contentEl: HTMLDivElement | null = null

  onMount(() => {
    untrack(() => root.recalculateHeight())

    const node = contentEl
    if (
      !node ||
      typeof ResizeObserver !== 'function' ||
      typeof MutationObserver !== 'function'
    ) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      untrack(() => root.recalculateHeight(true))
    })
    const mutationObserver = new MutationObserver(() => {
      untrack(() => root.recalculateHeight(true))
    })

    resizeObserver.observe(node)
    mutationObserver.observe(node, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    onCleanup(() => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    })
  })

  const state: ToastContentState = {
    get expanded() {
      return root.expanded()
    },
    get behind() {
      return root.visibleIndex() > 0
    },
  }

  return createRender<ToastContentState, Record<string, unknown>>({
    defaultElement: 'div',
    state,
    render: local.render,
    mapStateToDataAttributes: true,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      children: local.children,
      ref(element: HTMLElement) {
        contentEl = element as HTMLDivElement
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLDivElement)
        }
      },
    }),
  })
}
/** Public state for {@link ToastContent}. */
export interface ToastContentState extends Record<string, unknown> {
  expanded: boolean
  behind: boolean
}
/** Props for {@link ToastContent}. */
export type ToastContentProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ToastContentState, Record<string, unknown>>
}
