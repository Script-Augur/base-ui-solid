import { describe, expect, it } from 'vitest'

import {
  SCROLL_EDGE_TOLERANCE_PX,
  getMaxScrollOffset,
  normalizeScrollOffset,
} from './scrollEdges'

describe('getMaxScrollOffset', () => {
  it('returns zero when content fits', () => {
    expect(getMaxScrollOffset(100, 100)).toBe(0)
    expect(getMaxScrollOffset(80, 100)).toBe(0)
  })

  it('returns the overflow distance', () => {
    expect(getMaxScrollOffset(250, 100)).toBe(150)
  })
})

describe('normalizeScrollOffset', () => {
  it('returns zero when max is non-positive', () => {
    expect(normalizeScrollOffset(10, 0)).toBe(0)
    expect(normalizeScrollOffset(10, -5)).toBe(0)
  })

  it('clamps to the range', () => {
    expect(normalizeScrollOffset(-20, 100)).toBe(0)
    expect(normalizeScrollOffset(150, 100)).toBe(100)
    expect(normalizeScrollOffset(40, 100)).toBe(40)
  })

  it('snaps near edges within tolerance', () => {
    expect(normalizeScrollOffset(SCROLL_EDGE_TOLERANCE_PX, 100)).toBe(0)
    expect(normalizeScrollOffset(100 - SCROLL_EDGE_TOLERANCE_PX, 100)).toBe(100)
  })
})
