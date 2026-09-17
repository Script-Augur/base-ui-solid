import { afterEach, describe, expect, it, vi } from 'vitest'

import { Interval } from './interval'

describe('Interval', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('invokes the callback on each interval tick via requestAnimationFrame', () => {
    vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] })

    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const frames: Array<FrameRequestCallback> = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames[id - 1] = () => undefined
    })

    const callback = vi.fn()
    const interval = new Interval()
    interval.start(50, callback)

    expect(callback).not.toHaveBeenCalled()
    expect(frames).toHaveLength(1)

    now = 25
    frames[0]!(now)
    expect(callback).not.toHaveBeenCalled()
    expect(frames).toHaveLength(2)

    now = 50
    frames[1]!(now)
    expect(callback).toHaveBeenCalledOnce()
    expect(frames).toHaveLength(3)

    now = 100
    frames[2]!(now)
    expect(callback).toHaveBeenCalledTimes(2)

    interval.clear()
    const callsAfterClear = callback.mock.calls.length
    now = 200
    frames[3]!(now)
    expect(callback).toHaveBeenCalledTimes(callsAfterClear)
  })

  it('clears a pending interval', () => {
    const frames: Array<FrameRequestCallback> = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb)
      return frames.length
    })
    const cancel = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancel)

    const callback = vi.fn()
    const interval = new Interval()
    interval.start(100, callback)
    interval.clear()

    expect(cancel).toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
  })

  it('does not resurrect after clear() is called from inside the callback', () => {
    vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] })

    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const frames: Array<FrameRequestCallback> = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames[id - 1] = () => undefined
    })

    const interval = new Interval()
    const callback = vi.fn(() => {
      interval.clear()
    })
    interval.start(50, callback)

    now = 50
    const pendingBefore = frames.length
    frames[0]!(now)
    expect(callback).toHaveBeenCalledOnce()
    // No additional frame should be scheduled after clear-from-callback.
    expect(frames).toHaveLength(pendingBefore)
  })
})
