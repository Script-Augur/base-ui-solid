import { createRoot } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import { createControlled } from './createControlled'

describe('createControlled', () => {
  it('uses defaultValue when uncontrolled', () => {
    createRoot(dispose => {
      const [value, setValue] = createControlled({ defaultValue: 1 })
      expect(value()).toBe(1)
      setValue(2)
      expect(value()).toBe(2)
      dispose()
    })
  })

  it('mirrors controlled value and calls onChange', () => {
    createRoot(dispose => {
      let controlled = 10
      const onChange = vi.fn((next: number) => {
        controlled = next
      })
      const [value, setValue] = createControlled({
        value: () => controlled,
        defaultValue: 0,
        onChange,
      })
      expect(value()).toBe(10)
      setValue(20)
      expect(onChange).toHaveBeenCalledWith(20)
      expect(value()).toBe(20)
      dispose()
    })
  })

  it('supports functional updates', () => {
    createRoot(dispose => {
      const [value, setValue] = createControlled({ defaultValue: 3 })
      setValue(prev => prev + 1)
      expect(value()).toBe(4)
      dispose()
    })
  })
})
