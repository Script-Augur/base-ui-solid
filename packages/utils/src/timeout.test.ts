import { afterEach, describe, expect, it, vi } from "vitest"

import { Timeout } from "./timeout"

describe("Timeout", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("invokes the callback after the delay via requestAnimationFrame", () => {
    vi.useFakeTimers({ toFake: ["performance", "requestAnimationFrame"] })

    let now = 0
    vi.spyOn(performance, "now").mockImplementation(() => now)

    const frames: Array<FrameRequestCallback> = []
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => {
        frames.push(cb)
        return frames.length
      },
    )
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames[id - 1] = () => undefined
    })

    const callback = vi.fn()
    const timeout = new Timeout()
    timeout.start(16, callback)

    expect(callback).not.toHaveBeenCalled()
    expect(frames).toHaveLength(1)

    now = 8
    frames[0]!(now)
    expect(callback).not.toHaveBeenCalled()
    expect(frames).toHaveLength(2)

    now = 20
    frames[1]!(now)
    expect(callback).toHaveBeenCalledOnce()
  })

  it("clears a pending timeout", () => {
    const frames: Array<FrameRequestCallback> = []
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => {
        frames.push(cb)
        return frames.length
      },
    )
    const cancel = vi.fn()
    vi.stubGlobal("cancelAnimationFrame", cancel)

    const callback = vi.fn()
    const timeout = new Timeout()
    timeout.start(100, callback)
    timeout.clear()

    expect(cancel).toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
  })
})
