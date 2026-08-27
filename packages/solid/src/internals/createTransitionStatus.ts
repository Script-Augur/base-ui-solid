import { AnimationFrame } from '@script-augur/base-ui-utils'
import { createEffect, createSignal, onCleanup, untrack } from 'solid-js'

import type { Accessor, Setter } from 'solid-js'
/**
 * Provides a status string for CSS animations, mirroring Base UI
 * `useTransitionStatus`.
 *
 * @param open - Whether the element should be considered open/visible.
 * @param enableIdleState - Enables the `'idle'` state between `'starting'` and `'ending'`.
 * @param deferEndingState - Defers `'ending'` to the next animation frame.
 */
export function createTransitionStatus(
  open: Accessor<boolean>,
  enableIdleState = false,
  deferEndingState = false
): {
  mounted: Accessor<boolean>
  mountedAssign: Setter<boolean>
  transitionStatus: Accessor<TransitionStatus>
} {
  const [transitionStatus, transitionStatusAssign] =
    createSignal<TransitionStatus>(
      open() && enableIdleState ? 'idle' : undefined
    )
  const [mounted, mountedAssign] = createSignal(open())

  createEffect(() => {
    const isOpen = open()

    if (isOpen) {
      if (!untrack(mounted)) {
        mountedAssign(true)
        transitionStatusAssign('starting')
      }

      if (!enableIdleState) {
        const frame = new AnimationFrame()
        frame.request(() => {
          transitionStatusAssign(undefined)
        })
        onCleanup(() => frame.cancel())
        return
      }

      if (untrack(mounted) && untrack(transitionStatus) !== 'idle') {
        transitionStatusAssign('starting')
      }
      const frame = new AnimationFrame()
      frame.request(() => {
        transitionStatusAssign('idle')
      })
      onCleanup(() => frame.cancel())
      return
    }

    // Closing
    if (untrack(mounted)) {
      if (deferEndingState) {
        if (untrack(transitionStatus) !== 'ending') {
          const frame = new AnimationFrame()
          frame.request(() => {
            transitionStatusAssign('ending')
          })
          onCleanup(() => frame.cancel())
        }
      } else if (untrack(transitionStatus) !== 'ending') {
        transitionStatusAssign('ending')
      }
    } else if (untrack(transitionStatus) === 'ending') {
      transitionStatusAssign(undefined)
    }
  })

  createEffect(() => {
    if (!mounted() && untrack(transitionStatus) === 'ending') {
      transitionStatusAssign(undefined)
    }
  })

  return {
    mounted,
    mountedAssign,
    transitionStatus,
  }
}
export type TransitionStatus = 'starting' | 'ending' | 'idle' | undefined
