import { AnimationFrame } from '@script-augur/base-ui-utils'
import { createEffect, onCleanup } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Global kill-switch for CSS enter/exit animations (tests / reduced motion).
 */
declare global {
  var BASE_UI_ANIMATIONS_DISABLED: boolean | undefined
}

/**
 * Runs `fn` once animations on `element` finish (or immediately when animations
 * are unavailable / disabled).
 *
 * @param element - Element to watch, or `null` to no-op.
 * @param fn - Callback after animations settle.
 * @param signal - Optional abort signal.
 * @param waitForStartingStyleRemoved - Wait for `data-starting-style` removal first.
 */
export function runOnceAnimationsFinished(
  element: HTMLElement | null | undefined,
  fn: () => void,
  signal: AbortSignal | null = null,
  waitForStartingStyleRemoved = false
): void {
  if (element == null) {
    return
  }

  const resolvedElement = element

  if (
    typeof resolvedElement.getAnimations !== 'function' ||
    globalThis.BASE_UI_ANIMATIONS_DISABLED
  ) {
    fn()
    return
  }

  const frame = new AnimationFrame()

  function exec(): void {
    Promise.all(
      resolvedElement.getAnimations().map(animation => animation.finished)
    ).then(
      () => {
        if (!signal?.aborted) {
          fn()
        }
      },
      () => {
        if (signal?.aborted) {
          return
        }

        const currentAnimations = resolvedElement.getAnimations()
        if (
          currentAnimations.some(
            animation => animation.pending || animation.playState !== 'finished'
          )
        ) {
          exec()
          return
        }

        fn()
      }
    )
  }

  if (waitForStartingStyleRemoved) {
    const startingStyleAttribute = 'data-starting-style'

    if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
      frame.request(exec)
      return
    }

    const attributeObserver = new MutationObserver(() => {
      if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
        attributeObserver.disconnect()
        exec()
      }
    })

    attributeObserver.observe(resolvedElement, {
      attributes: true,
      attributeFilter: [startingStyleAttribute],
    })

    signal?.addEventListener('abort', () => attributeObserver.disconnect(), {
      once: true,
    })
    return
  }

  frame.request(exec)
}

/**
 * Calls `onComplete` when the CSS open/close animation or transition completes.
 *
 * Solid port of Base UI `useOpenChangeComplete`.
 *
 * @param parameters - Open state, element accessor, and completion callback.
 */
export function createOpenChangeComplete(parameters: {
  enabled?: Accessor<boolean> | boolean
  open: Accessor<boolean | undefined>
  element: Accessor<HTMLElement | null | undefined>
  onComplete: () => void
}): void {
  createEffect(() => {
    const enabled =
      typeof parameters.enabled === 'function'
        ? parameters.enabled()
        : (parameters.enabled ?? true)
    if (!enabled) {
      return
    }

    // Re-run when open or element identity changes.
    parameters.open()
    const element = parameters.element()

    const abortController = new AbortController()
    runOnceAnimationsFinished(
      element,
      parameters.onComplete,
      abortController.signal,
      parameters.open() === true
    )

    onCleanup(() => {
      abortController.abort()
    })
  })
}
