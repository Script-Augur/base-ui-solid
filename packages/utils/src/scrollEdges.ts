import { clamp } from './clamp'

/** Pixel slack treated as fully scrolled to a scroll edge. */
export const SCROLL_EDGE_TOLERANCE_PX = 1

/**
 * Maximum scroll offset for a given scrollable size and client size.
 *
 * @param scrollSize - Content size along the axis (`scrollWidth` / `scrollHeight`).
 * @param clientSize - Viewport size along the axis (`clientWidth` / `clientHeight`).
 * @returns Non-negative max scroll offset.
 */
export function getMaxScrollOffset(
  scrollSize: number,
  clientSize: number
): number {
  return Math.max(0, scrollSize - clientSize)
}

/**
 * Clamps a scroll offset and snaps values within {@link SCROLL_EDGE_TOLERANCE_PX}
 * of either edge to that edge.
 *
 * @param value - Raw scroll offset from the start edge.
 * @param max - Maximum scroll offset.
 * @returns Normalized offset in `[0, max]`.
 */
export function normalizeScrollOffset(value: number, max: number): number {
  if (max <= 0) return 0

  const clamped = clamp(value, 0, max)
  const startDistance = clamped
  const endDistance = max - clamped
  const withinStartTolerance = startDistance <= SCROLL_EDGE_TOLERANCE_PX
  const withinEndTolerance = endDistance <= SCROLL_EDGE_TOLERANCE_PX

  if (withinStartTolerance && withinEndTolerance) {
    return startDistance <= endDistance ? 0 : max
  }

  if (withinStartTolerance) return 0
  if (withinEndTolerance) return max

  return clamped
}
