/**
 * Schedules a repeating callback using `requestAnimationFrame` instead of
 * `setInterval`. Background tabs throttle `setInterval` aggressively (often to
 * ≥1s) and can queue work that fires in a burst on return; rAF pauses with the
 * tab and avoids that timer backlog.
 *
 * Matches `@base-ui/utils/useInterval`'s `Interval` class API used by
 * press-and-hold.
 *
 * @example
 * ```ts
 * import { Interval } from "@script-augur/base-ui-utils"
 *
 * const interval = new Interval()
 * interval.start(60, () => {
 *   // runs every ~60ms on animation frames
 * })
 * // later / on cleanup:
 * interval.clear()
 * ```
 */
export class Interval {
  private id: number | null = null
  private startTime = 0
  private delay = 0
  private callback: (() => void) | null = null

  /**
   * Creates an idle interval manager. Call {@link Interval.start} to schedule work.
   */
  constructor() {
    this.handleFrame = this.handleFrame.bind(this)
  }

  /**
   * Creates an idle interval manager. Call {@link Interval.start} to schedule work.
   */
  static create(): Interval {
    return new Interval()
  }

  /**
   * Executes `fn` at least every `delay` ms on animation frames, clearing any
   * previously scheduled call.
   *
   * @param delay - Minimum milliseconds between invocations.
   * @param fn - Function invoked on each tick.
   */
  start(delay: number, fn: () => void): void {
    this.clear()
    this.delay = delay
    this.callback = fn
    this.startTime = performance.now()
    this.id = requestAnimationFrame(this.handleFrame)
  }

  /**
   * Cancels a pending interval, if one is scheduled.
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
   * Alias for {@link Interval.clear} for dispose/effect cleanup call sites.
   */
  dispose(): void {
    this.clear()
  }

  /**
   * rAF tick: fires `callback` when enough time has passed since the last fire,
   * then schedules another frame while the interval remains active.
   *
   * @param now - High-resolution timestamp from `requestAnimationFrame`.
   */
  private handleFrame(now: number): void {
    if (this.callback == null) return

    if (now - this.startTime >= this.delay) {
      this.startTime = now
      this.callback()
    }

    // `callback` may call `clear()` (nulls `id`); don't resurrect a cancelled interval.
    if (this.id === null) return

    this.id = requestAnimationFrame(this.handleFrame)
  }
}
