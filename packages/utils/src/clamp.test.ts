import { describe, expect, it } from 'vitest'

import { clamp } from './clamp'
import { generateId } from './generateId'
import { mergeObjects } from './mergeObjects'
import { createStore } from './store'

describe('clamp', () => {
  it('clamps to the given range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe('generateId', () => {
  it('returns unique ids with a prefix', () => {
    const a = generateId('test')
    const b = generateId('test')
    expect(a).toMatch(/^test-\d+$/)
    expect(b).not.toBe(a)
  })
})

describe('mergeObjects', () => {
  it('merges defined values left to right', () => {
    expect(
      mergeObjects<{ a?: number; b?: string }>(
        { a: 1 },
        null,
        { b: 'x' },
        { a: 2 }
      )
    ).toEqual({ a: 2, b: 'x' })
  })
})

describe('createStore', () => {
  it('notifies subscribers on setState', () => {
    const store = createStore({ count: 0 })
    const values: Array<number> = []
    const unsubscribe = store.subscribe(state => {
      values.push(state.count)
    })
    store.setState({ count: 1 })
    store.setState(state => ({ count: state.count + 1 }))
    expect(store.getState().count).toBe(2)
    expect(values).toEqual([1, 2])
    unsubscribe()
    store.setState({ count: 3 })
    expect(values).toEqual([1, 2])
  })

  it('freezes the returned store shape', () => {
    const store = createStore({ count: 0 })
    expect(Object.isFrozen(store)).toBe(true)
    expect(() => {
      // @ts-expect-error verifying runtime freeze
      store.extra = true
    }).toThrow()
  })
})
