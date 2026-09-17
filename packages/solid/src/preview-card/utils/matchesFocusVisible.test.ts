import { afterEach, describe, expect, it, vi } from 'vitest'

import { matchesFocusVisible } from './matchesFocusVisible'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('matchesFocusVisible', () => {
  it('returns false for null', () => {
    expect(matchesFocusVisible(null)).toBe(false)
  })

  it('returns true in jsdom (upstream parity)', () => {
    const el = document.createElement('button')
    expect(matchesFocusVisible(el)).toBe(true)
  })

  it('uses :focus-visible matches when not in jsdom', () => {
    const original = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0.0.0',
    })

    const el = document.createElement('button')
    const matches = vi.spyOn(el, 'matches').mockReturnValue(false)
    expect(matchesFocusVisible(el)).toBe(false)
    expect(matches).toHaveBeenCalledWith(':focus-visible')

    matches.mockReturnValue(true)
    expect(matchesFocusVisible(el)).toBe(true)

    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get: () => original,
    })
  })
})
