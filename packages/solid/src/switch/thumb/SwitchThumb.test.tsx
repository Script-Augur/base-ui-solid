/**
 * Port of `@base-ui/react` Switch.Thumb tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { Switch } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Switch.Thumb />', () => {
  it('throws a descriptive error when rendered outside <Switch.Root>', () => {
    expect(() => {
      render(() => <Switch.Thumb />)
    }).toThrow(
      'Base UI: SwitchRootContext is missing. Switch parts must be placed within <Switch.Root>.'
    )
  })

  it('renders inside Switch.Root', () => {
    render(() => (
      <Switch.Root>
        <Switch.Thumb data-testid="thumb" />
      </Switch.Root>
    ))
    expect(screen.getByTestId('thumb')).toBeInTheDocument()
  })

  it('should spread extra props', () => {
    render(() => (
      <Switch.Root>
        <Switch.Thumb data-testid="thumb" data-foo="bar" />
      </Switch.Root>
    ))
    expect(screen.getByTestId('thumb')).toHaveAttribute('data-foo', 'bar')
  })
})
