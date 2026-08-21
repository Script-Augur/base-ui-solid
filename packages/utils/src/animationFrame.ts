/**
 * Manages a single `requestAnimationFrame` handle with cancel/dispose helpers.
 * Prefer this over bare `requestAnimationFrame` so cleanup is consistent.
 *
 * @example
 * ```ts
 * import { AnimationFrame } from "@script-augur/base-ui-utils"
 *
 * const frame = new AnimationFrame()
 * frame.request((time) => {
 *   // paint / measure using `time`
 * })
 * // later / on cleanup:
 * frame.cancel()
 * ```
 */
export class AnimationFrame {
  private id: number | null = null
  private callback: FrameRequestCallback | null = null

  /**
   * Creates an idle animation-frame manager. Call {@link AnimationFrame.request}
   * to schedule work.
   */
  constructor() {
    this.handleFrame = this.handleFrame.bind(this)
  }

  /**
   * Schedules `callback` on the next animation frame, canceling any prior
   * pending frame from this instance.
   *
   * @param callback - Invoked with the rAF timestamp.
   */
  request(callback: FrameRequestCallback): void {
    this.cancel()
    this.callback = callback
    this.id = requestAnimationFrame(this.handleFrame)
  }

  /**
   * Cancels a pending animation frame, if one is scheduled.
   */
  cancel(): void {
    if (this.id !== null) {
      cancelAnimationFrame(this.id)
      this.id = null
    }
    this.callback = null
  }

  /**
   * Alias for {@link AnimationFrame.cancel} for dispose/effect cleanup call sites.
   */
  dispose(): void {
    this.cancel()
  }

  /**
   * rAF entry point; clears internal state then invokes the stored callback.
   *
   * @param time - High-resolution timestamp from `requestAnimationFrame`.
   */
  private handleFrame(time: number): void {
    const callback = this.callback
    this.id = null
    this.callback = null
    callback?.(time)
  }
}
