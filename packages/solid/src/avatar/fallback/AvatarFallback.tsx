import { Timeout } from '@script-augur/base-ui-utils'
import {
  Show,
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useAvatarRootContext } from '../root/AvatarRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { AvatarRootState } from '../root/AvatarRoot'
import type { JSX } from 'solid-js'

/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 *
 * @param componentProps - Fallback props (`delay`, `render`, …).
 * @returns A Solid JSX element.
 */
export function AvatarFallback(
  componentProps: AvatarFallbackProps
): JSX.Element {
  const context = useAvatarRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'delay',
    'children',
    'ref',
  ])

  const delay = () => local.delay ?? 0
  const [delayPassed, delayPassedAssign] = createSignal(delay() === 0)
  const timeout = new Timeout()

  createEffect(() => {
    const currentDelay = delay()
    if (currentDelay > 0) {
      timeout.start(currentDelay, () => delayPassedAssign(true))
    } else {
      // Once the fallback is shown without a delay, keep it visible. Otherwise a later
      // change from no delay to a number would re-hide an already-visible fallback.
      delayPassedAssign(true)
    }
    onCleanup(() => timeout.clear())
  })

  const state: AvatarFallbackState = {
    get imageLoadingStatus() {
      return context.imageLoadingStatus()
    },
  }

  const enabled = () =>
    context.imageLoadingStatus() !== 'loaded' &&
    (delay() === 0 || delayPassed())

  return (
    <Show when={enabled()}>
      {createRender<AvatarFallbackState, Record<string, unknown>>({
        defaultElement: 'span',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get children() {
            return local.children
          },
          ref: local.ref,
        }),
      })}
    </Show>
  )
}

/** Public state exposed to `render` functions. */
export interface AvatarFallbackState
  extends AvatarRootState, Record<string, unknown> {}

/** Props for {@link AvatarFallback}. */
export type AvatarFallbackProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  /**
   * How long to wait before showing the fallback. Specified in milliseconds.
   * @default 0
   */
  delay?: number
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<AvatarFallbackState, Record<string, unknown>>
}
