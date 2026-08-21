/**
 * Schedules `callback` after at least `delay` ms using `requestAnimationFrame`
 * instead of `setTimeout`. Background tabs throttle `setTimeout` aggressively
 * (often to ≥1s) and can queue work that fires in a burst on return; rAF
 * pauses with the tab and avoids that timer backlog.
 *
 * @example
 * ```ts
 * import { Timeout } from "@script-augur/base-ui-utils"
 *
 * const timeout = new Timeout()
 * timeout.start(300, () => {
 *   // runs ~300ms later on an animation frame
 * })
 * // later / on cleanup:
 * timeout.clear()
 * ```
 */
export class Timeout {
  private id: number | null = null
  private startTime = 0
  private delay = 0
  private callback: (() => void) | null = null

  /**
   * Creates an idle timeout manager. Call {@link Timeout.start} to schedule work.
   */
  constructor() {
    this.handleFrame = this.handleFrame.bind(this)
  }

  /**
   * Starts (or restarts) a delayed callback. Clears any previously scheduled call.
   *
   * @param delay - Minimum milliseconds to wait before invoking `callback`.
   * @param callback - Function invoked once the delay has elapsed.
   */
  start(delay: number, callback: () => void): void {
    this.clear()
    this.delay = delay
    this.callback = callback
    this.startTime = performance.now()
    this.id = requestAnimationFrame(this.handleFrame)
  }

  /**
   * Cancels a pending timeout, if one is scheduled.
   */
  clear(): void {
    if (this.id !== null) {
      cancelAnimationFrame(this.id)
      this.id = null
    }
    this.callback = null
    this.delay = 0
    this.startTime = 0
  }

  /**
   * Alias for {@link Timeout.clear} for dispose/effect cleanup call sites.
   */
  dispose(): void {
    this.clear()
  }

  /**
   * rAF tick: fires `callback` when enough time has passed, otherwise schedules
   * another frame.
   *
   * @param now - High-resolution timestamp from `requestAnimationFrame`.
   */
  private handleFrame(now: number): void {
    if (now - this.startTime >= this.delay) {
      const callback = this.callback
      this.id = null
      this.callback = null
      callback?.()
      return
    }
    this.id = requestAnimationFrame(this.handleFrame)
  }
}
