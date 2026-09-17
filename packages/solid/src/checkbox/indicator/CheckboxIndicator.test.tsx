/**
 * Port of `@base-ui/react` Checkbox.Indicator tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { Checkbox } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Checkbox.Indicator />', () => {
  it('throws when rendered outside Checkbox.Root', () => {
    expect(() => {
      render(() => <Checkbox.Indicator />)
    }).toThrow(/CheckboxRootContext is missing/)
  })

  it('should not render indicator by default', () => {
    render(() => (
      <Checkbox.Root>
        <Checkbox.Indicator data-testid="indicator" />
      </Checkbox.Root>
    ))
    expect(screen.queryByTestId('indicator')).toBeNull()
  })

  it('should render indicator when checked', () => {
    render(() => (
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-testid="indicator" />
      </Checkbox.Root>
    ))
    expect(screen.getByTestId('indicator')).toBeInTheDocument()
  })

  it('should spread extra props', () => {
    render(() => (
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-testid="indicator" data-foo="bar" />
      </Checkbox.Root>
    ))
    expect(screen.getByTestId('indicator')).toHaveAttribute('data-foo', 'bar')
  })

  describe('keepMounted', () => {
    it('mounted when unchecked', () => {
      render(() => (
        <Checkbox.Root>
          <Checkbox.Indicator keepMounted data-testid="indicator" />
        </Checkbox.Root>
      ))
      expect(screen.getByTestId('indicator')).toBeInTheDocument()
    })

    it('mounted when checked', () => {
      render(() => (
        <Checkbox.Root defaultChecked>
          <Checkbox.Indicator keepMounted data-testid="indicator" />
        </Checkbox.Root>
      ))
      expect(screen.getByTestId('indicator')).toBeInTheDocument()
    })

    it('mounted when indeterminate', () => {
      render(() => (
        <Checkbox.Root indeterminate>
          <Checkbox.Indicator keepMounted data-testid="indicator" />
        </Checkbox.Root>
      ))
      expect(screen.getByTestId('indicator')).toBeInTheDocument()
    })
  })

  it('renders when indeterminate even if unchecked', () => {
    render(() => (
      <Checkbox.Root indeterminate>
        <Checkbox.Indicator data-testid="indicator" />
      </Checkbox.Root>
    ))
    expect(screen.getByTestId('indicator')).toBeInTheDocument()
  })
})
