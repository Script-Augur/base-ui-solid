/**
 * Shared helpers for Number Field press-and-hold tests (rAF-based Timeout/Interval).
 */
import { afterEach, beforeEach, vi } from 'vitest'

/** Matches `createPressAndHold` defaults. */
export const PRESS_HOLD_START_DELAY_MS = 400
export const PRESS_HOLD_TICK_DELAY_MS = 60

/**
 * Installs a controllable rAF + `performance.now` clock for Timeout/Interval.
 *
 * @returns Helpers to advance time.
 */
export function installRafClock() {
  let frames: Array<FrameRequestCallback> = []
  let now = 0

  beforeEach(() => {
    frames = []
    now = 0
    vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] })
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames[id - 1] = () => undefined
    })
  })

  afterEach(() => {
    frames = []
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  /**
   * Advances the fake clock by `ms`, flushing rAF callbacks in ~16ms steps so
   * Interval can fire multiple times across a large jump.
   */
  function advance(ms: number) {
    const end = now + ms
    while (now < end) {
      now = Math.min(now + 16, end)
      const pending = frames.splice(0, frames.length)
      for (const frame of pending) {
        frame(now)
      }
    }
  }

  return { advance }
}
