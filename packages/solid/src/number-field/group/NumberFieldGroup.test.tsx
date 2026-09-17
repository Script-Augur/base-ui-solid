import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { NumberField } from '../index'

afterEach(() => {
  cleanup()
})

describe('<NumberField.Group />', () => {
  it('renders with role="group"', () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Group data-testid="group">
          <NumberField.Input />
        </NumberField.Group>
      </NumberField.Root>
    ))
    expect(screen.getByTestId('group')).toHaveAttribute('role', 'group')
  })
})
