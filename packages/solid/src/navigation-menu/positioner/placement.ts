import type { Placement } from '../../internals/useFloating'

/**
 * Maps Base UI `side` + `align` to a Floating UI `Placement`.
 *
 * @param side - Preferred side of the anchor.
 * @param align - Alignment along that side.
 * @returns A Floating UI placement string.
 */
export function sideAlignToPlacement(side: Side, align: Align): Placement {
  const physical =
    side === 'inline-start' ? 'left' : side === 'inline-end' ? 'right' : side
  if (align === 'center') return physical
  return `${physical}-${align}` as Placement
}

/**
 * Splits a Floating UI placement into Base UI `side` + `align`.
 *
 * @param placement - Resolved Floating UI placement.
 * @returns Side and align tuple.
 */
export function placementToSideAlign(placement: Placement): {
  side: Side
  align: Align
} {
  const [rawSide, rawAlign] = placement.split('-') as [string, string?]
  const side = (
    rawSide === 'left' ||
    rawSide === 'right' ||
    rawSide === 'top' ||
    rawSide === 'bottom'
      ? rawSide
      : 'bottom'
  ) as Side
  const align = rawAlign === 'start' || rawAlign === 'end' ? rawAlign : 'center'
  return { side, align }
}

/** Logical side relative to the anchor. */
export type Side =
  'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'

/** Alignment along the side axis. */
export type Align = 'start' | 'center' | 'end'
