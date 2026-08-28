/**
 * Shared helpers for Scroll Area tests (rAF-based {@link Timeout} clock).
 */
import { afterEach, beforeEach, vi } from 'vitest'

/**
 * Installs a controllable rAF + `performance.now` clock for `Timeout` tests.
 *
 * @returns Helpers to advance time and restore mocks.
 */
export function installRafClock() {
  let frames: Array<FrameRequestCallback | null> = []
  let now = 0
  let nextId = 1

  beforeEach(() => {
    frames = []
    now = 0
    nextId = 1
    vi.useFakeTimers({ toFake: ['performance'] })
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextId
      nextId += 1
      frames[id] = cb
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames[id] = null
    })
  })

  afterEach(() => {
    frames = []
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function tick(ms: number) {
    now += ms
    const pending = Object.entries(frames)
    frames = []
    for (const [, frame] of pending) {
      frame?.(now)
    }
    // Flush frames scheduled by the callbacks we just ran.
    let guard = 0
    while (frames.some(Boolean) && guard < 50) {
      const next = Object.entries(frames)
      frames = []
      for (const [, frame] of next) {
        frame?.(now)
      }
      guard += 1
    }
  }

  return { tick }
}
