/**
 * Port of `@base-ui/react` Meter value tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Meter } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Meter.Value />', () => {
  describe('prop: children', () => {
    it('renders the value when children is not provided', () => {
      render(() => (
        <Meter.Root value={30}>
          <Meter.Value data-testid="value" />
        </Meter.Root>
      ))

      const value = screen.getByTestId('value')
      expect(value.textContent).toBe(
        (0.3).toLocaleString(undefined, { style: 'percent' })
      )
    })

    it('renders a formatted value when a format is provided', () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      }
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v)
      }

      render(() => (
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value" />
        </Meter.Root>
      ))

      const value = screen.getByTestId('value')
      expect(value.textContent).toBe(formatValue(30))
    })

    it('accepts a render function', () => {
      const renderSpy = vi.fn()
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      }
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v)
      }
      render(() => (
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value">{renderSpy}</Meter.Value>
        </Meter.Root>
      ))
      expect(renderSpy.mock.lastCall?.[0]).toEqual(formatValue(30))
      expect(renderSpy.mock.lastCall?.[1]).toEqual(30)
    })

    it('passes updated arguments to the render function when value changes', async () => {
      const renderSpy = vi.fn()
      const [value, valueAssign] = createSignal(30)

      render(() => (
        <Meter.Root value={value()}>
          <Meter.Value>{renderSpy}</Meter.Value>
        </Meter.Root>
      ))

      expect(renderSpy.mock.lastCall?.[0]).toEqual(
        (0.3).toLocaleString(undefined, { style: 'percent' })
      )
      expect(renderSpy.mock.lastCall?.[1]).toEqual(30)

      valueAssign(60)
      await flushMicrotasks()

      expect(renderSpy.mock.lastCall?.[0]).toEqual(
        (0.6).toLocaleString(undefined, { style: 'percent' })
      )
      expect(renderSpy.mock.lastCall?.[1]).toEqual(60)
    })
  })
})

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}
