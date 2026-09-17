import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Field.Item />', () => {
  describe('prop: disabled', () => {
    it('reflects disabled state on the item', () => {
      const renderItem = vi.fn()

      render(() => (
        <Field.Root>
          <Field.Item
            disabled
            data-testid="item"
            render={(props, state) => {
              renderItem(state)
              return <div {...props} />
            }}
          />
        </Field.Root>
      ))

      expect(screen.getByTestId('item')).toHaveAttribute('data-disabled')
      expect(renderItem.mock.lastCall?.[0].disabled).toBe(true)
    })
  })
})
